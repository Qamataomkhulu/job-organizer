import type { PublicJob } from "./types";

const RELOCATION_SUPPORT_PATTERN = /\b(relocation\s+(assistance|support|package|available)|relocate(?:d|ing)?\s+(with|and)?\s*(support|assistance|package))\b/i;

export function hasRelocationSupport(job: Pick<PublicJob, "description" | "tags">) {
  return RELOCATION_SUPPORT_PATTERN.test(`${job.description} ${job.tags.join(" ")}`);
}
