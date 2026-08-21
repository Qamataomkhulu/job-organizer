import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  completeRefreshRun: vi.fn(),
  createRefreshRun: vi.fn(),
  ensureSourceConfig: vi.fn(),
  getResumeByIdForUser: vi.fn(),
  markSourceRefreshed: vi.fn(),
  replaceMatchesForResume: vi.fn(),
  upsertJobs: vi.fn(),
  listCurrentJobs: vi.fn(),
}));
const jobicyMocks = vi.hoisted(() => ({ fetchJobicyJobs: vi.fn() }));
const adzunaMocks = vi.hoisted(() => ({ fetchAdzunaJobs: vi.fn() }));

vi.mock("../db", () => dbMocks);
vi.mock("./jobicy", () => jobicyMocks);
vi.mock("./adzuna", () => adzunaMocks);
vi.mock("./ai", () => ({ extractResumeProfile: vi.fn(), generateCareerGuidance: vi.fn(), generateNaturalMasterCv: vi.fn() }));
vi.mock("./governmentDepartments", () => ({ fetchSupportedGovernmentDepartmentReport: vi.fn() }));
vi.mock("./package", () => ({ buildOutputZip: vi.fn(), formatRankedJobList: vi.fn() }));
vi.mock("./eligibility", () => ({ hasRelocationSupport: vi.fn() }));
vi.mock("./careerDirection", () => ({ activeCareerSearchTerms: vi.fn(() => ["SOC Analyst"]) }));
vi.mock("./scoring", () => ({ isCybersecurityProfile: vi.fn(() => false), isEligibleDirectMatch: vi.fn(() => true), scoreJobAgainstProfile: vi.fn() }));

import { refreshJobicyAndRankForResume } from "./service";

describe("user refresh with a shared Adzuna cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.createRefreshRun.mockResolvedValue({ id: 91 });
    dbMocks.getResumeByIdForUser.mockResolvedValue({
      id: 44,
      userId: 7,
      profileJson: JSON.stringify({ strongestRoleFamily: "Cybersecurity" }),
    });
    dbMocks.listCurrentJobs.mockResolvedValue([]);
    jobicyMocks.fetchJobicyJobs.mockResolvedValue([]);
  });

  it("uses the shared stored Adzuna listings and does not issue an Adzuna request for a user refresh", async () => {
    await refreshJobicyAndRankForResume(7, 44, "user");

    expect(jobicyMocks.fetchJobicyJobs).toHaveBeenCalledTimes(1);
    expect(adzunaMocks.fetchAdzunaJobs).not.toHaveBeenCalled();
    expect(dbMocks.listCurrentJobs).toHaveBeenCalledWith(["jobicy", "adzuna", "gov-department"], 350);
  });
});
