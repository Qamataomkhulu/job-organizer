import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJobicyJobs } from "./jobicy";

describe("fetchJobicyJobs", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalises a documented public API listing while retaining the canonical source URL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jobs: [{
          id: 123,
          url: "https://jobicy.com/jobs/example",
          jobTitle: "Cybersecurity Analyst",
          companyName: "Example Security",
          jobGeo: "Anywhere",
          jobType: ["Full time"],
          jobIndustry: ["Cybersecurity"],
          jobDescription: "<p>Investigate <strong>alerts</strong>.</p>",
          pubDate: "2026-08-19T00:00:00Z",
        }],
      }),
    }));

    const jobs = await fetchJobicyJobs();

    expect(jobs).toEqual([expect.objectContaining({
      source: "jobicy",
      externalId: "123",
      sourceUrl: "https://jobicy.com/jobs/example",
      title: "Cybersecurity Analyst",
      workMode: "remote",
      description: "Investigate alerts.",
    })]);
  });

  it("uses selected Career Direction titles as deduplicated Cybersecurity-category queries", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ jobs: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchJobicyJobs({ industry: "cybersecurity", tags: ["SOC Analyst", "SOC Analyst", "Threat Hunter"] });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0][0])).toContain("industry=cybersecurity");
    expect(String(fetchMock.mock.calls[1][0])).toContain("tag=SOC+Analyst");
    expect(String(fetchMock.mock.calls[2][0])).toContain("tag=Threat+Hunter");
  });
});
