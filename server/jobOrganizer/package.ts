import { PassThrough } from "node:stream";
import { ZipArchive } from "archiver";
import type { ResumeProfile } from "./types";

export type PackageJob = {
  rank: number;
  title: string;
  employer: string;
  location: string;
  fitTier: "Priority" | "Strong" | "Selective";
  sourceUrl: string;
  score: number;
  rationale: string;
  evidenceTags: string[];
  workMode: "remote" | "hybrid" | "onsite" | "unknown";
  relocationSupported: boolean;
};

export function formatRankedJobList(profile: ResumeProfile, jobs: PackageJob[]) {
  const rows = jobs.map(job => `| ${job.rank} | [${job.title}](${job.sourceUrl}) | ${job.employer} | ${job.location} | ${job.workMode === "remote" ? "Remote" : job.workMode} ${job.relocationSupported ? "· Relocation support" : ""} | **${job.fitTier}** | ${job.score}% | ${job.evidenceTags.join(", ") || job.rationale} |`);
  return `# ${profile.candidateName || "Candidate"} — Ranked Job Shortlist\n\nThis list contains current public vacancies ranked against verified role-title and skill evidence. Open each job title to apply at the original source.\n\n| Rank | Vacancy | Employer | Location | Eligibility | Fit tier | Evidence Match | Why it matches |\n|---:|---|---|---|---|---|---:|---|\n${rows.join("\n")}\n\n> Remote and relocation labels reflect the source content available at refresh time. Recheck each listing’s status and eligibility before applying. Job Organizer retains the original source link and does not submit applications automatically.\n`;
}

export async function buildOutputZip(masterCv: string, rankedJobs: string) {
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on("data", chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
  const complete = new Promise<Buffer>((resolve, reject) => {
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.on("error", (error: Error) => stream.destroy(error));
  archive.pipe(stream);
  archive.append(masterCv, { name: "master-cv.md" });
  archive.append(rankedJobs, { name: "ranked-job-shortlist.md" });
  await archive.finalize();
  return complete;
}
