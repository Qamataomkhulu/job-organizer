import type { PublicJob, ResumeProfile, ScoredJob } from "./types";
import { exploreRoleFamilies } from "./careerDirection";

const STOP_WORDS = new Set([
  "and", "the", "with", "from", "for", "your", "that", "this", "role", "senior", "junior", "level", "professional", "experience", "security",
]);

const CYBERSECURITY_PROFILE_PATTERN = /\b(cyber|soc|csoc|siem|incident response|threat intelligence|vulnerability|penetration test|information security|network security)\b/i;
const DIRECT_CYBERSECURITY_TITLE_PATTERN = /\b(soc|csoc|cyber ?security|information security|security operations|siem|incident response|threat intelligence|threat hunter|vulnerability (management|analyst)|penetration test(?:er|ing)?|network security|detection engineer)\b|\b(security|cybersecurity|information security)\s+(analyst|engineer|specialist|consultant|administrator|officer)\b/i;
const NON_PRACTITIONER_TITLE_PATTERN = /\b(account executive|sales|marketing|product|program manager|project manager|social|media|recruit(?:er|ment)|customer success|business development|operations manager|chief information security officer|\bciso\b|head of|vice president|\bvp\b)\b/i;
const CAREER_DIRECTION_CYBER_TITLE_PATTERN = /\b(soc|csoc|security operations|cyber ?security analyst|security analyst|information security|incident response|threat intelligence|threat hunt(?:er|ing)?|vulnerability|penetration test(?:er|ing)?|siem|detection engineer|network security|cyber defense)\b/i;
const SOUTH_AFRICA_PATTERN = /\b(south africa|johannesburg|gauteng|pretoria|cape town|western cape|eastern cape|port elizabeth|gqeberha|durban|kwazulu[- ]natal|bloemfontein)\b/i;
const UNRESTRICTED_REMOTE_PATTERN = /\b(anywhere|worldwide|world wide|global|work from anywhere|anywhere in the world|all countries|international applicants)\b/i;
const EXPLICIT_REMOTE_DESCRIPTION_PATTERN = /\b(open to (international|worldwide) applicants|work from anywhere|anywhere in the world)\b/i;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#/\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function usefulTerms(values: string[]) {
  return Array.from(new Set(values
    .flatMap(value => normalize(value).split(" "))
    .filter(term => term.length >= 3 && !STOP_WORDS.has(term))));
}

function roleTitleTerms(values: string[]) {
  return Array.from(new Set(values
    .flatMap(value => normalize(value).split(" "))
    .filter(term => term.length >= 3 && !["and", "the", "with", "from", "for", "senior", "junior", "level", "role", "professional", "lead", "analyst", "manager", "engineer", "specialist", "consultant", "director", "administrator", "officer", "coordinator", "associate"].includes(term))));
}

export function isCybersecurityProfile(profile: ResumeProfile) {
  return CYBERSECURITY_PROFILE_PATTERN.test([
    profile.professionalHeadline,
    profile.professionalSummary,
    profile.strongestRoleFamily,
    ...profile.targetRoleTitles,
    ...profile.roleFamilies,
    ...profile.skillKeywords,
  ].join(" "));
}

export function isDirectCybersecurityRole(job: Pick<PublicJob, "title">) {
  return DIRECT_CYBERSECURITY_TITLE_PATTERN.test(job.title) && !NON_PRACTITIONER_TITLE_PATTERN.test(job.title);
}

export function isAlignedToCybersecurityCareerDirection(profile: ResumeProfile, job: Pick<PublicJob, "title">) {
  const normalizedTitle = normalize(job.title);
  const hasExactSelectedTitle = profile.targetRoleTitles.some(title => {
    const normalizedTarget = normalize(title);
    return normalizedTarget.length > 4 && normalizedTitle.includes(normalizedTarget);
  });
  return hasExactSelectedTitle || CAREER_DIRECTION_CYBER_TITLE_PATTERN.test(job.title);
}

export function adjacentCareerPathTitle(profile: ResumeProfile, job: Pick<PublicJob, "title">) {
  const normalizedJobTitle = normalize(job.title);
  return exploreRoleFamilies(profile)
    .flatMap(path => path.suggestedTitles.map(title => ({ family: path.family, title })))
    .find(path => normalizedJobTitle.includes(normalize(path.title))) ?? null;
}

export function isSouthAfricaOrExplicitlyEligibleRemote(job: Pick<PublicJob, "location" | "workMode" | "description" | "tags">) {
  const structuredEligibility = `${job.location} ${job.tags.join(" ")}`;
  return SOUTH_AFRICA_PATTERN.test(structuredEligibility)
    || (job.workMode === "remote" && UNRESTRICTED_REMOTE_PATTERN.test(structuredEligibility))
    || EXPLICIT_REMOTE_DESCRIPTION_PATTERN.test(job.description)
    || /\b(relocation\s+(assistance|support|package|available)|visa\s+(sponsorship|support)|sponsorship\s+available)\b/i.test(job.description);
}

export function isEligibleDirectMatch(profile: ResumeProfile, job: PublicJob) {
  if (!isSouthAfricaOrExplicitlyEligibleRemote(job)) return false;
  return !isCybersecurityProfile(profile) || (isDirectCybersecurityRole(job) && isAlignedToCybersecurityCareerDirection(profile, job));
}

export function scoreJobAgainstProfile(profile: ResumeProfile, job: PublicJob): ScoredJob {
  const titleCorpus = normalize(job.title);
  const evidenceCorpus = normalize([job.description, ...job.tags].join(" "));
  const corpus = `${titleCorpus} ${evidenceCorpus}`;
  const skillTerms = usefulTerms(profile.skillKeywords);
  const matchedTerms = skillTerms.filter(term => evidenceCorpus.includes(term));
  const titleHits = profile.targetRoleTitles.filter(title => {
    const normalizedTitle = normalize(title);
    return normalizedTitle.length > 4 && titleCorpus.includes(normalizedTitle);
  });
  const titleKeywordHits = roleTitleTerms(profile.targetRoleTitles).filter(term => titleCorpus.includes(term));
  const hasMeaningfulKeywordAlignment = titleKeywordHits.length >= 2;
  const familyHits = profile.roleFamilies.filter(family => {
    const normalizedFamily = normalize(family);
    return normalizedFamily.length > 4 && titleCorpus.includes(normalizedFamily);
  });
  const adjacentPath = adjacentCareerPathTitle(profile, job);
  const directCybersecurityTitleScore = isCybersecurityProfile(profile) && isDirectCybersecurityRole(job) ? 20 : 0;
  const roleTitleScore = Math.min(56, titleHits.length * 32 + (hasMeaningfulKeywordAlignment ? titleKeywordHits.length * 8 : 0) + familyHits.length * 12 + directCybersecurityTitleScore + (adjacentPath ? 12 : 0));
  const rawScore = Math.min(100, Math.round(
    roleTitleScore +
    Math.min(32, matchedTerms.length * 6) +
    (job.workMode === "remote" ? 4 : 0) +
    (/(cyber|security|soc|incident|threat|risk|compliance)/.test(titleCorpus) ? 8 : 0)
  ));
  const score = roleTitleScore > 0 ? rawScore : Math.min(44, rawScore);
  const fitTier: ScoredJob["fitTier"] = score >= 70 ? "Priority" : score >= 45 ? "Strong" : "Selective";
  const evidenceTags = [
    ...titleHits.map(title => `Role title · ${title}`),
    ...(directCybersecurityTitleScore > 0 ? ["Role domain · Cybersecurity practitioner"] : []),
    ...(adjacentPath ? [`Career path · ${adjacentPath.family}`] : []),
    ...(hasMeaningfulKeywordAlignment ? titleKeywordHits.filter(term => !titleHits.some(title => normalize(title).split(" ").includes(term))).map(term => `Role keyword · ${term}`) : []),
    ...familyHits.map(family => `Role family · ${family}`),
    ...matchedTerms.map(term => `Evidence · ${term}`),
  ].slice(0, 6);
  const rationale = evidenceTags.length > 0
    ? evidenceTags.join(" · ")
    : "Limited direct role-title evidence; review the requirements before applying.";
  return { score, fitTier, rationale, evidenceTags, roleTitleScore };
}

export function isTopTwentyFiveRank(rank: number) {
  return rank <= 25;
}
