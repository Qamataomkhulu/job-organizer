import { describe, expect, it, vi } from "vitest";

const profile = {
  candidateName: "Candidate",
  professionalHeadline: "SOC Analyst",
  professionalSummary: "",
  skillKeywords: ["SIEM", "incident response"],
  certifications: [],
  targetRoleTitles: ["SOC Analyst"],
  roleFamilies: ["Security Operations"],
  employmentTimeline: [{ title: "Cyber Security Analyst", employer: "Previous Employer", startDate: "2022", endDate: "2024" }],
  strongestRoleFamily: "Security Operations",
  evidenceNotes: [],
};

const mocks = vi.hoisted(() => ({
  getLatestResumeForUser: vi.fn(),
  updateResumeProfileForUser: vi.fn().mockResolvedValue(undefined),
  refreshJobicyAndRankForResume: vi.fn().mockResolvedValue({ fetched: 12, matched: 7 }),
}));

vi.mock("./db", () => ({
  getLatestResumeForUser: mocks.getLatestResumeForUser,
  updateResumeProfileForUser: mocks.updateResumeProfileForUser,
}));
vi.mock("./jobOrganizer/service", () => ({
  createLatestOutputPackage: vi.fn(),
  ensureConfiguredSources: vi.fn(),
  ensureJobicySource: vi.fn(),
  refreshJobicyAndRankForUser: vi.fn(),
  refreshJobicyAndRankForResume: mocks.refreshJobicyAndRankForResume,
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function caller() {
  return appRouter.createCaller({
    user: { id: 42, openId: "career-user", name: "Career User", email: "career@example.com", loginMethod: "google", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} },
    res: {},
  } as unknown as TrpcContext);
}

describe("career preferences", () => {
  it("returns prior-employer titles and only grounded adjacent paths from the latest résumé", async () => {
    mocks.getLatestResumeForUser.mockResolvedValue({ id: 9, profileJson: JSON.stringify(profile) });
    const result = await caller().career.direction();
    expect(result?.employmentTitles).toEqual(["Cyber Security Analyst"]);
    expect(result?.paths.every(path => path.sourceTitles.length > 0)).toBe(true);
  });

  it("stores selected titles on the signed-in user’s latest résumé and runs a targeted live refresh", async () => {
    mocks.getLatestResumeForUser.mockResolvedValue({ id: 9, profileJson: JSON.stringify(profile) });
    const result = await caller().career.updatePreferredTitles({ titles: ["SOC Team Lead", "Incident Response Lead"] });
    expect(result).toEqual({ preferredTitles: ["SOC Team Lead", "Incident Response Lead"], fetched: 12, matched: 7 });
    expect(mocks.updateResumeProfileForUser).toHaveBeenCalledWith(9, 42, expect.any(String));
    expect(JSON.parse(mocks.updateResumeProfileForUser.mock.calls[0][2]).targetRoleTitles).toEqual(["SOC Team Lead", "Incident Response Lead"]);
    expect(mocks.refreshJobicyAndRankForResume).toHaveBeenCalledWith(42, 9, "user");
  });
});
