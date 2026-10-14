import { desc } from "drizzle-orm";
import { PDFParse } from "pdf-parse";
import { storagePut } from "../storage";
import * as db from "../db";
import { extractResumeProfile, generateCareerGuidance, generateNaturalMasterCv } from "./ai";
import { fetchAdzunaJobs } from "./adzuna";
import { fetchSupportedGovernmentDepartmentReport } from "./governmentDepartments";
import { fetchJobicyJobs } from "./jobicy";
import { buildOutputZip, formatRankedJobList, type PackageJob } from "./package";
import { hasRelocationSupport } from "./eligibility";
import { activeCareerSearchTerms } from "./careerDirection";
import { isCybersecurityProfile, isEligibleDirectMatch, scoreJobAgainstProfile } from "./scoring";
import type { ResumeProfile } from "./types";

function filenameSegment(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-160) || "resume.pdf";
}

function parseStringArray(value: string | null | undefined) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function dedupeScoredVacancies<T extends { jobId: number; publicJob: { title: string; employer: string; location: string }; score: number }>(items: T[]) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const retained = new Map<string, T>();
  for (const item of items) {
    const key = [item.publicJob.title, item.publicJob.employer, item.publicJob.location].map(normalize).join("|");
    const existing = retained.get(key);
    if (!existing || item.score > existing.score) retained.set(key, item);
  }
  return Array.from(retained.values());
}

export function nextWeeklyGovernmentRefreshAt(reference = new Date()) {
  const next = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate(), 6, 0, 0, 0));
  const daysUntilMonday = (1 - reference.getUTCDay() + 7) % 7;
  next.setUTCDate(next.getUTCDate() + daysUntilMonday);
  if (next <= reference) next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

export function nextTwiceDailyAdzunaRefreshAt(reference = new Date()) {
  const next = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate(), 6, 0, 0, 0));
  if (next <= reference) next.setUTCHours(18, 0, 0, 0);
  if (next <= reference) {
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(6, 0, 0, 0);
  }
  return next;
}

export async function extractPdfText(fileBuffer: Buffer) {
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const result = await parser.getText();
    return result.text.replace(/\s+/g, " ").trim();
  } finally {
    await parser.destroy();
  }
}

export async function ingestResume(userId: number, filename: string, fileBuffer: Buffer) {
  const rawText = await extractPdfText(fileBuffer);
  if (rawText.length < 80) throw new Error("The PDF did not contain enough selectable text to analyse. Please upload a text-based résumé PDF.");
  const profile = await extractResumeProfile(rawText);
  const [masterCv, guidance] = await Promise.all([
    generateNaturalMasterCv(profile),
    generateCareerGuidance(profile),
  ]);
  const stored = await storagePut(`job-organizer/${userId}/resumes/${Date.now()}-${filenameSegment(filename)}`, fileBuffer, "application/pdf");
  const resume = await db.createResume({
    userId,
    originalFilename: filename,
    storageKey: stored.key,
    storageUrl: stored.url,
    rawText,
    profileJson: JSON.stringify(profile),
    strongestRoleFamily: profile.strongestRoleFamily || "General career matching",
    masterCv,
    careerGapGuidance: guidance.careerGapGuidance,
    salaryGuidance: guidance.salaryGuidance,
  });
  await refreshJobicyAndRankForResume(userId, resume.id, "user");
  return resume;
}

export async function ensureJobicySource() {
  return db.ensureSourceConfig({
    source: "jobicy",
    displayName: "Jobicy Remote Jobs API",
    status: "approved",
    termsUrl: "https://jobicy.com/jobs-rss-feed",
    adapterKind: "public-api",
    rateLimit: "Once daily (maximum once per hour)",
    accessNotes: "Public JSON API approved by the source for job-discovery products; preserve the canonical Jobicy URL and attribution.",
    enabled: 1,
  });
}

export async function ensureAdzunaSource() {
  const input = {
    source: "adzuna",
    displayName: "Adzuna South Africa Jobs API",
    status: "approved",
    termsUrl: "https://www.adzuna.com/terms-and-conditions.html",
    adapterKind: "authenticated-public-api",
    rateLimit: "Shared twice-daily cache refresh; user searches use stored listings",
    accessNotes: "Server-side Adzuna API integration for South African job discovery, refreshed twice daily into a shared cache. Display Adzuna as the source, preserve each Adzuna redirect URL as the application handoff, keep content current, do not expose credentials, and never make an Adzuna request for an individual user search.",
    enabled: 1,
  } as const;
  const existing = await db.ensureSourceConfig(input);
  if (existing.rateLimit !== input.rateLimit || existing.accessNotes !== input.accessNotes) {
    return db.updateSourceMetadata(input.source, input);
  }
  return existing;
}

export async function ensureGovernmentDepartmentSource() {
  const input = {
    source: "gov-department",
    displayName: "South African Government Department Vacancies",
    status: "approved",
    termsUrl: "https://www.gov.za/about-government/government-jobs",
    adapterKind: "official-directory-table-list",
    rateLimit: "Weekly supported-page scan; table/list metadata only; no PDF-body extraction",
    accessNotes: "Discovers official department vacancy pages from gov.za and ingests only approved Environment, Health, Justice, Employment and Labour, and GCIS patterns. Preserves department name, closing date, original PDF or official detail handoff, and source-provided salary text where present; unsupported formats are skipped.",
    enabled: 1,
  } as const;
  const existing = await db.ensureSourceConfig(input);
  if (existing.accessNotes !== input.accessNotes) return db.updateSourceMetadata(input.source, input);
  return existing;
}

export async function ensureConfiguredSources() {
  await Promise.all([
    ensureJobicySource(),
    ensureAdzunaSource(),
    ensureGovernmentDepartmentSource(),
    db.ensureSourceConfig({
      source: "pnet",
      displayName: "Pnet",
      status: "pending",
      termsUrl: "https://www.pnet.co.za/about-us/general-terms-conditions/",
      adapterKind: "no-adapter",
      rateLimit: "Not configured",
      accessNotes: "Pending a documented permission basis, written approval, or official data feed/API. Automated retrieval is disabled.",
      enabled: 0,
    }),
  ]);
}

async function refreshJobicy(initiatedBy: "user" | "schedule", profile?: ResumeProfile) {
  await ensureJobicySource();
  const run = await db.createRefreshRun("jobicy", initiatedBy);
  try {
    const jobs = await fetchJobicyJobs(profile ? {
      tags: activeCareerSearchTerms(profile),
      industry: isCybersecurityProfile(profile) ? "cybersecurity" : undefined,
    } : undefined);
    await db.upsertJobs(jobs);
    await db.completeRefreshRun(run.id, jobs.length);
    await db.markSourceRefreshed("jobicy");
    return jobs.length;
  } catch (error) {
    await db.failRefreshRun(run.id, error instanceof Error ? error.message : "Unknown refresh error");
    throw error;
  }
}

async function refreshAdzuna(initiatedBy: "user" | "schedule", profile?: ResumeProfile) {
  await ensureAdzunaSource();
  const run = await db.createRefreshRun("adzuna", initiatedBy);
  try {
    const jobs = await fetchAdzunaJobs(profile ? { titles: activeCareerSearchTerms(profile) } : undefined);
    await db.upsertJobs(jobs);
    await db.completeRefreshRun(run.id, jobs.length);
    await db.markSourceRefreshed("adzuna", nextTwiceDailyAdzunaRefreshAt());
    return jobs.length;
  } catch (error) {
    await db.failRefreshRun(run.id, error instanceof Error ? error.message : "Unknown refresh error");
    throw error;
  }
}

export async function refreshGovernmentDepartmentsForAllUsers() {
  await ensureGovernmentDepartmentSource();
  const run = await db.createRefreshRun("gov-department", "schedule");
  try {
    const report = await fetchSupportedGovernmentDepartmentReport();
    if (report.successfulPages === 0) throw new Error("All supported government department pages were unavailable; no stale or inferred vacancies were stored.");
    const jobs = report.jobs;
    await db.upsertJobs(jobs);
    await db.completeRefreshRun(run.id, jobs.length);
    await db.markSourceRefreshed("gov-department", nextWeeklyGovernmentRefreshAt());
    const latestResumes = await db.listLatestResumes(100);
    for (const resume of latestResumes) await rerankStoredJobsForResume(resume.userId, resume.id);
    return { fetched: jobs.length, resumesRanked: latestResumes.length };
  } catch (error) {
    await db.failRefreshRun(run.id, error instanceof Error ? error.message : "Unknown government department refresh error");
    throw error;
  }
}

export async function refreshJobicyAndRankForResume(userId: number, resumeId: number, initiatedBy: "user" | "schedule") {
  const resume = await db.getResumeByIdForUser(resumeId, userId);
  if (!resume) throw new Error("Résumé not found.");
  const profile = JSON.parse(resume.profileJson) as ResumeProfile;
  const fetched = await refreshJobicy(initiatedBy, profile);
  const matched = await rerankStoredJobsForResume(userId, resumeId);
  return { fetched, matched };
}

export async function rerankStoredJobsForResume(userId: number, resumeId: number) {
  const resume = await db.getResumeByIdForUser(resumeId, userId);
  if (!resume) throw new Error("Résumé not found.");
  const profile = JSON.parse(resume.profileJson) as ResumeProfile;
  const jobs = await db.listCurrentJobs(["jobicy", "adzuna", "gov-department"], 350);
  const matches = dedupeScoredVacancies(jobs.map(job => {
    const publicJob = {
      source: job.source as "jobicy" | "adzuna" | "gov-department",
      sourceType: job.sourceType as "job-listing" | "gov-department",
      externalId: job.externalId,
      sourceUrl: job.sourceUrl,
      title: job.title,
      employer: job.employer,
      departmentName: job.departmentName,
      location: job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      salaryText: job.salaryText,
      description: job.description,
      tags: parseStringArray(job.tagsJson),
      publishedAt: job.publishedAt,
      closingDate: job.closingDate,
    } as const;
    return { jobId: job.id, publicJob, ...scoreJobAgainstProfile(profile, publicJob) };
  }).filter(({ publicJob }) => {
    const notExpired = !publicJob.closingDate || publicJob.closingDate.getTime() > Date.now();
    return notExpired && isEligibleDirectMatch(profile, publicJob);
  }).map(({ publicJob: _publicJob, ...match }) => match).sort((a, b) => b.score - a.score).slice(0, 100);
  await db.replaceMatchesForResume(userId, resume.id, matches);
  return matches.length;
}

export async function refreshJobicyAndRankForUser(userId: number) {
  const latestResume = await db.getLatestResumeForUser(userId);
  if (!latestResume) throw new Error("Upload a résumé before refreshing vacancies.");
  return refreshJobicyAndRankForResume(userId, latestResume.id, "user");
}

export async function refreshJobicyForAllUsers() {
  const fetched = await refreshJobicy("schedule");
  const latestResumes = await db.listLatestResumes(100);
  const jobs = await db.listCurrentJobs(["jobicy", "adzuna", "gov-department"], 350);
  for (const resume of latestResumes) {
    const profile = JSON.parse(resume.profileJson) as ResumeProfile;
    const matches = dedupeScoredVacancies(jobs.map(job => {
      const publicJob = {
        source: job.source as "jobicy" | "adzuna" | "gov-department",
        sourceType: job.sourceType as "job-listing" | "gov-department",
        externalId: job.externalId,
        sourceUrl: job.sourceUrl,
        title: job.title,
        employer: job.employer,
        departmentName: job.departmentName,
        location: job.location,
        workMode: job.workMode,
        employmentType: job.employmentType,
        salaryText: job.salaryText,
        description: job.description,
        tags: parseStringArray(job.tagsJson),
        publishedAt: job.publishedAt,
        closingDate: job.closingDate,
      } as const;
      return { jobId: job.id, publicJob, ...scoreJobAgainstProfile(profile, publicJob) };
    }).filter(({ publicJob }) => isEligibleDirectMatch(profile, publicJob))).map(({ publicJob: _publicJob, ...match }) => match).sort((a, b) => b.score - a.score).slice(0, 100);
    await db.replaceMatchesForResume(resume.userId, resume.id, matches);
  }
  return { fetched, resumesRanked: latestResumes.length };
}

export async function refreshAdzunaCacheForAllUsers() {
  const fetched = await refreshAdzuna("schedule");
  const latestResumes = await db.listLatestResumes(100);
  for (const resume of latestResumes) await rerankStoredJobsForResume(resume.userId, resume.id);
  return { fetched, resumesRanked: latestResumes.length };
}

export async function createLatestOutputPackage(userId: number) {
  const resume = await db.getLatestResumeForUser(userId);
  if (!resume) throw new Error("Upload a résumé before generating an output package.");
  const profile = JSON.parse(resume.profileJson) as ResumeProfile;
  const matches = await db.listMatchesForUser(userId, 25);
  const packageJobs: PackageJob[] = matches.map((item, index) => ({
    rank: index + 1,
    title: item.job.title,
    employer: item.job.employer,
    location: item.job.location,
    fitTier: item.match.fitTier,
    sourceUrl: item.job.sourceUrl,
    score: item.match.score,
    rationale: item.match.rationale,
    evidenceTags: parseStringArray(item.match.evidenceTagsJson),
    workMode: item.job.workMode,
    relocationSupported: hasRelocationSupport({ description: item.job.description, tags: parseStringArray(item.job.tagsJson) }),
  }));
  const jobList = formatRankedJobList(profile, packageJobs);
  const zip = await buildOutputZip(resume.masterCv, jobList);
  const stored = await storagePut(`job-organizer/${userId}/packages/${Date.now()}-job-organizer-output.zip`, zip, "application/zip");
  return { url: stored.url, key: stored.key, jobCount: packageJobs.length };
}
