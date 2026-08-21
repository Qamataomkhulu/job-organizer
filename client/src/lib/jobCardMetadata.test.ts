import { describe, expect, it } from "vitest";
import { getJobCardMetadata } from "./jobCardMetadata";

describe("getJobCardMetadata", () => {
  it("shows only confirmed remote and relocation labels while preserving role and skill evidence", () => {
    const result = getJobCardMetadata({
      workMode: "remote",
      description: "Relocation assistance is available for the right candidate. Work with SIEM operations.",
      tagsJson: "[\"Cybersecurity\"]",
      evidenceTagsJson: JSON.stringify(["Role title · Senior SOC Analyst", "Evidence · siem"]),
      rationale: "",
    });
    expect(result.eligibilityTags).toEqual([{ label: "Fully remote", kind: "remote" }, { label: "Relocation support", kind: "relocation" }]);
    expect(result.evidenceTags).toEqual([{ label: "Role title · Senior SOC Analyst", kind: "role" }, { label: "Evidence · siem", kind: "evidence" }]);
  });

  it("does not imply relocation support when a source does not state it", () => {
    const result = getJobCardMetadata({ workMode: "remote", description: "Remote opportunity", tagsJson: "[]", evidenceTagsJson: null, rationale: "Limited direct role-title evidence." });
    expect(result.eligibilityTags).toEqual([{ label: "Fully remote", kind: "remote" }]);
  });
});
