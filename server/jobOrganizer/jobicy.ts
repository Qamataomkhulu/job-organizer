import type { PublicJob } from "./types";

type JobicyJob = {
  id: number | string;
  url: string;
  jobTitle: string;
  companyName: string;
  jobGeo?: string;
  jobType?: string[];
  jobIndustry?: string[];
  jobDescription?: string;
  pubDate?: string;
};

export type JobicySearchOptions = {
  industry?: string;
  tags?: string[];
};

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
}

function buildUrl(options: JobicySearchOptions, tag?: string) {
  const params = new URLSearchParams({ count: tag ? "25" : "100" });
  if (options.industry) params.set("industry", options.industry);
  if (tag) params.set("tag", tag);
  return `https://jobicy.com/api/v2/remote-jobs?${params.toString()}`;
}

function normaliseJobs(payload: { jobs?: JobicyJob[] }): PublicJob[] {
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  return jobs
    .filter(job => job.id && job.url && job.jobTitle && job.companyName)
    .map(job => ({
      source: "jobicy" as const,
      externalId: String(job.id),
      sourceUrl: job.url,
      title: job.jobTitle.trim(),
      employer: job.companyName.trim(),
      location: job.jobGeo?.trim() || "Remote",
      workMode: "remote" as const,
      employmentType: job.jobType?.join(", ") || null,
      description: stripHtml(job.jobDescription || job.jobTitle),
      tags: [...(job.jobIndustry || []), ...(job.jobType || [])],
      publishedAt: job.pubDate ? new Date(job.pubDate) : null,
    }));
}

export async function fetchJobicyJobs(options: JobicySearchOptions = {}): Promise<PublicJob[]> {
  const uniqueTags = Array.from(new Set((options.tags ?? []).map(tag => tag.trim()).filter(Boolean))).slice(0, 8);
  const urls = [buildUrl(options), ...uniqueTags.map(tag => buildUrl(options, tag))];
  const payloads = await Promise.all(urls.map(async url => {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Jobicy request failed with ${response.status}`);
    return response.json() as Promise<{ jobs?: JobicyJob[] }>;
  }));
  return Array.from(new Map(payloads.flatMap(normaliseJobs).map(job => [job.externalId, job])).values());
}
