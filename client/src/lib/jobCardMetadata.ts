export type JobCardMetadataInput = {
  workMode: "remote" | "hybrid" | "onsite" | "unknown";
  description: string;
  tagsJson: string;
  evidenceTagsJson: string | null;
  rationale: string;
};

export type JobCardTag = { label: string; kind: "remote" | "relocation" | "role" | "evidence" };

const relocationPattern = /\b(relocation\s+(assistance|support|package|available)|relocate(?:d|ing)?\s+(with|and)?\s*(support|assistance|package))\b/i;

function parseStringArray(value: string | null) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function getJobCardMetadata(input: JobCardMetadataInput) {
  const sourceText = `${input.description} ${parseStringArray(input.tagsJson).join(" ")}`;
  const eligibilityTags: JobCardTag[] = [];
  if (input.workMode === "remote") eligibilityTags.push({ label: "Fully remote", kind: "remote" });
  if (relocationPattern.test(sourceText)) eligibilityTags.push({ label: "Relocation support", kind: "relocation" });
  const storedEvidence = parseStringArray(input.evidenceTagsJson);
  const fallbackEvidence = input.rationale.startsWith("Aligned evidence:")
    ? input.rationale.replace("Aligned evidence:", "").replace(/\.$/, "").split(",").map(value => `Evidence · ${value.trim()}`)
    : [];
  const evidenceTags = (storedEvidence.length > 0 ? storedEvidence : fallbackEvidence).slice(0, 6).map(label => ({
    label,
    kind: label.startsWith("Role") ? "role" as const : "evidence" as const,
  }));
  return { eligibilityTags, evidenceTags };
}
