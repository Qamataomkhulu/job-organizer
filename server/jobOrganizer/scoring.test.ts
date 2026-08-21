import { describe, expect, it } from "vitest";
import { isEligibleDirectMatch, scoreJobAgainstProfile } from "./scoring";
import type { PublicJob, ResumeProfile } from "./types";

const profile: ResumeProfile = {
  candidateName: "Example Candidate",
  professionalHeadline: "Senior SOC Analyst",
  professionalSummary: "",
  skillKeywords: ["SIEM", "incident response", "threat analysis", "vulnerability management", "QRadar"],
  certifications: [],
  targetRoleTitles: ["Senior SOC Analyst", "Security Analyst"],
  roleFamilies: ["Security Operations", "Incident Response"],
  employmentTimeline: [],
  strongestRoleFamily: "Security Operations",
  evidenceNotes: [],
};

const job: PublicJob = {
  source: "jobicy",
  externalId: "1",
  sourceUrl: "https://example.com/job",
  title: "Senior SOC Analyst",
  employer: "Example Co",
  location: "Remote",
  workMode: "remote",
  employmentType: "Full time",
  description: "Investigate SIEM alerts, coordinate incident response, and improve vulnerability management.",
  tags: ["Cybersecurity"],
  publishedAt: null,
};

describe("scoreJobAgainstProfile", () => {
  it("uses only the three required fit tiers and rewards direct evidence", () => {
    const result = scoreJobAgainstProfile(profile, job);
    expect(["Priority", "Strong", "Selective"]).toContain(result.fitTier);
    expect(result.fitTier).toBe("Priority");
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.evidenceTags).toContain("Role title · Senior SOC Analyst");
  });

  it("ranks an aligned job title above a role with only generic transferable functions", () => {
    const titleAligned = scoreJobAgainstProfile(profile, job);
    const genericFunctionRole = scoreJobAgainstProfile(profile, { ...job, title: "Operations Manager", description: "Investigate SIEM alerts and coordinate incident response." });
    expect(titleAligned.roleTitleScore).toBeGreaterThan(genericFunctionRole.roleTitleScore);
    expect(titleAligned.score).toBeGreaterThan(genericFunctionRole.score);
  });

  it("does not treat a single generic title word as a meaningful role-title alignment", () => {
    const genericSecurityTitle = scoreJobAgainstProfile(profile, { ...job, title: "Technical Program Manager - Security" });
    expect(genericSecurityTitle.roleTitleScore).toBe(0);
    expect(genericSecurityTitle.evidenceTags).not.toContain("Role keyword · security");
  });

  it("keeps function-only overlap below the Strong threshold when no distinctive role alignment exists", () => {
    const genericDataRole = scoreJobAgainstProfile(profile, { ...job, title: "Lead Data Analyst, Product Analytics", description: "Incident analysis, automation, reporting, and response coordination." });
    expect(genericDataRole.fitTier).toBe("Selective");
    expect(genericDataRole.score).toBeLessThan(45);
  });

  it("recognises closely related cybersecurity practitioner titles even when they are not verbatim target titles", () => {
    const cybersecurityAnalyst = scoreJobAgainstProfile(profile, { ...job, title: "Cybersecurity Analyst", location: "Johannesburg, South Africa" });
    expect(cybersecurityAnalyst.roleTitleScore).toBeGreaterThan(0);
    expect(cybersecurityAnalyst.fitTier).not.toBe("Selective");
    expect(cybersecurityAnalyst.evidenceTags).toContain("Role domain · Cybersecurity practitioner");
  });

  it("rejects unrelated remote roles and country-restricted cybersecurity roles from a direct South Africa-first shortlist", () => {
    const socialRole = { ...job, title: "Staff Social Strategy & Operations Manager", location: "USA", description: "Run social campaigns worldwide.", tags: ["remote"] };
    const usOnlySecurityRole = { ...job, title: "Cybersecurity Analyst", location: "USA", description: "Applicants must be authorised to work in the United States.", tags: ["remote"] };
    expect(isEligibleDirectMatch(profile, socialRole)).toBe(false);
    expect(isEligibleDirectMatch(profile, usOnlySecurityRole)).toBe(false);
  });

  it("requires a Career Direction-aligned cybersecurity title and structured worldwide eligibility", () => {
    const applicationSecurityRole = { ...job, title: "Application Security Engineer", location: "Anywhere", description: "A global company with a distributed team.", tags: ["Cybersecurity"] };
    const usaSecurityRole = { ...job, title: "SOC Analyst", location: "USA", description: "A global company with a distributed team.", tags: ["Cybersecurity"] };
    expect(isEligibleDirectMatch(profile, applicationSecurityRole)).toBe(false);
    expect(isEligibleDirectMatch(profile, usaSecurityRole)).toBe(false);
  });

  it("raises an evidence-backed adjacent Career Direction title above the function-only tier", () => {
    const detectionEngineer = scoreJobAgainstProfile(profile, {
      ...job,
      title: "Detection Engineer",
      location: "Johannesburg, South Africa",
      workMode: "hybrid",
      description: "Build SIEM detections and coordinate incident response.",
      tags: ["Cybersecurity"],
    });
    expect(detectionEngineer.fitTier).toBe("Strong");
    expect(detectionEngineer.evidenceTags).toContain("Career path · Detection Engineering & SIEM");
  });

  it("retains South African and explicitly worldwide cybersecurity vacancies", () => {
    const southAfricanSocRole = { ...job, title: "SOC Analyst", location: "Johannesburg, South Africa", workMode: "hybrid" as const };
    const worldwideThreatRole = { ...job, title: "Threat Intelligence Analyst", location: "Anywhere", description: "Investigate SIEM alerts and coordinate incident response.", tags: ["Cybersecurity"] };
    expect(isEligibleDirectMatch(profile, southAfricanSocRole)).toBe(true);
    expect(isEligibleDirectMatch(profile, worldwideThreatRole)).toBe(true);
  });
});
