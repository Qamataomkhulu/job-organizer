import { describe, expect, it } from "vitest";
import { buildOutputZip, formatRankedJobList } from "./package";

describe("output package", () => {
  it("creates a ZIP file containing a linked job list", async () => {
    const list = formatRankedJobList({
      candidateName: "Example Candidate",
      professionalHeadline: "Security Analyst",
      professionalSummary: "",
      skillKeywords: [],
      certifications: [],
      targetRoleTitles: [],
      roleFamilies: [],
      employmentTimeline: [],
      strongestRoleFamily: "Security Operations",
      evidenceNotes: [],
    }, [{
      rank: 1,
      title: "Security Analyst",
      employer: "Example Co",
      location: "Remote",
      workMode: "remote",
      relocationSupported: false,
      fitTier: "Priority",
      sourceUrl: "https://example.com/job",
      score: 80,
      rationale: "Aligned evidence: security.",
      evidenceTags: ["Role title · Security Analyst", "Evidence · security"],
    }]);
    const zip = await buildOutputZip("# Master CV", list);
    expect(zip.subarray(0, 2).toString()).toBe("PK");
    expect(list).toContain("[Security Analyst](https://example.com/job)");
    expect(list).toContain("Remote");
  });
});
