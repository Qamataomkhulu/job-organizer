import { describe, expect, it } from "vitest";
import { activeCareerSearchTerms, exploreRoleFamilies, historyTitles } from "./careerDirection";
import type { ResumeProfile } from "./types";

const profile: ResumeProfile = {
  candidateName: "Example",
  professionalHeadline: "SOC Team Lead",
  professionalSummary: "",
  skillKeywords: ["SIEM", "QRadar", "incident response", "vulnerability management"],
  certifications: [],
  targetRoleTitles: ["SOC Team Lead"],
  roleFamilies: ["Security Operations"],
  employmentTimeline: [{ title: "Security Operations Center Team Lead", employer: "Example Employer", startDate: "2021", endDate: "2024" }],
  strongestRoleFamily: "Security Operations",
  evidenceNotes: [],
};

describe("career direction", () => {
  it("uses titles from prior employers as the grounding evidence for adjacent paths", () => {
    expect(historyTitles(profile)).toEqual(["Security Operations Center Team Lead"]);
    const paths = exploreRoleFamilies(profile);
    expect(paths.map(path => path.family)).toContain("Detection Engineering & SIEM");
    expect(paths.find(path => path.family === "Detection Engineering & SIEM")?.sourceTitles).toContain("Security Operations Center Team Lead");
    expect(paths.filter(path => path.family.toLowerCase().includes("security operations"))).toHaveLength(1);
  });

  it("does not invent unrelated cloud or governance paths without supporting evidence", () => {
    const paths = exploreRoleFamilies(profile);
    expect(paths.map(path => path.family)).not.toContain("Cloud Security");
    expect(paths.map(path => path.family)).not.toContain("Security Governance, Risk & Compliance");
  });

  it("turns selected titles and grounded adjacent paths into a capped search plan", () => {
    const terms = activeCareerSearchTerms(profile);
    expect(terms).toContain("SOC Team Lead");
    expect(terms).toContain("Detection Engineer");
    expect(terms).not.toContain("Cloud Security Analyst");
    expect(terms.length).toBeLessThanOrEqual(8);
  });
});
