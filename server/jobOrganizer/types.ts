export type EmploymentEntry = {
  title: string;
  employer: string;
  startDate: string;
  endDate: string;
};

export type ResumeProfile = {
  candidateName: string;
  professionalHeadline: string;
  professionalSummary: string;
  skillKeywords: string[];
  certifications: string[];
  targetRoleTitles: string[];
  roleFamilies: string[];
  employmentTimeline: EmploymentEntry[];
  strongestRoleFamily: string;
  evidenceNotes: string[];
};

export type Guidance = {
  careerGapGuidance: string;
  salaryGuidance: string;
};

export type PublicJob = {
  source: "jobicy" | "adzuna" | "gov-department";
  sourceType?: "job-listing" | "gov-department";
  externalId: string;
  sourceUrl: string;
  title: string;
  employer: string;
  departmentName?: string | null;
  location: string;
  workMode: "remote" | "hybrid" | "onsite" | "unknown";
  employmentType: string | null;
  salaryText?: string | null;
  description: string;
  tags: string[];
  publishedAt: Date | null;
  closingDate?: Date | null;
};

export type ScoredJob = {
  score: number;
  fitTier: "Priority" | "Strong" | "Selective";
  rationale: string;
  evidenceTags: string[];
  roleTitleScore: number;
};
