import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAdzunaJobs } from "./adzuna";

describe("fetchAdzunaJobs", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("queries South Africa from selected Career Direction titles and preserves Adzuna application redirects", async () => {
    const previousId = process.env.ADZUNA_APP_ID;
    const previousKey = process.env.ADZUNA_APP_KEY;
    process.env.ADZUNA_APP_ID = "test-id";
    process.env.ADZUNA_APP_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [{
      id: 73,
      redirect_url: "https://adzuna.example/apply/73",
      title: "SOC Analyst",
      description: "Remote incident response work.",
      created: "2026-08-21T00:00:00Z",
      company: { display_name: "Example Security" },
      location: { display_name: "Johannesburg, South Africa" },
      category: { label: "IT Jobs" },
      contract_time: "full_time",
      salary_min: 450000,
      salary_max: 600000,
    }] }) });
    vi.stubGlobal("fetch", fetchMock);

    const jobs = await fetchAdzunaJobs({ titles: ["SOC Analyst", "SOC Analyst"] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/jobs/za/search/1?");
    expect(String(fetchMock.mock.calls[0][0])).toContain("what=SOC+Analyst");
    expect(jobs).toEqual([expect.objectContaining({ source: "adzuna", externalId: "73", sourceUrl: "https://adzuna.example/apply/73", workMode: "remote", salaryText: "R 450 000 – R 600 000 (as listed by Adzuna)" })]);
    if (previousId === undefined) delete process.env.ADZUNA_APP_ID; else process.env.ADZUNA_APP_ID = previousId;
    if (previousKey === undefined) delete process.env.ADZUNA_APP_KEY; else process.env.ADZUNA_APP_KEY = previousKey;
  });
});
