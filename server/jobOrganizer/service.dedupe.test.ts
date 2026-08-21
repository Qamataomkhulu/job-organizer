import { describe, expect, it } from "vitest";
import { dedupeScoredVacancies, nextTwiceDailyAdzunaRefreshAt, nextWeeklyGovernmentRefreshAt } from "./service";

describe("dedupeScoredVacancies", () => {
  it("retains the best-scored copy of an equivalent role returned by different approved sources", () => {
    const items = [
      { jobId: 1, score: 72, publicJob: { title: "SOC Analyst", employer: "Example Security", location: "Johannesburg" } },
      { jobId: 2, score: 88, publicJob: { title: "Senior SOC Analyst", employer: "Example Security", location: "Johannesburg" } },
      { jobId: 3, score: 90, publicJob: { title: "SOC Analyst", employer: "Example Security", location: "Johannesburg" } },
    ];
    expect(dedupeScoredVacancies(items).map(item => item.jobId)).toEqual([3, 2]);
  });

  it("calculates the next Monday 06:00 UTC government refresh rather than a generic seven-day interval", () => {
    expect(nextWeeklyGovernmentRefreshAt(new Date("2026-08-21T06:12:39.000Z")).toISOString()).toBe("2026-08-24T06:00:00.000Z");
    expect(nextWeeklyGovernmentRefreshAt(new Date("2026-08-24T06:00:01.000Z")).toISOString()).toBe("2026-08-31T06:00:00.000Z");
  });

  it("calculates the next 06:00 or 18:00 UTC Adzuna cache refresh", () => {
    expect(nextTwiceDailyAdzunaRefreshAt(new Date("2026-08-21T05:59:59.000Z")).toISOString()).toBe("2026-08-21T06:00:00.000Z");
    expect(nextTwiceDailyAdzunaRefreshAt(new Date("2026-08-21T06:00:00.000Z")).toISOString()).toBe("2026-08-21T18:00:00.000Z");
    expect(nextTwiceDailyAdzunaRefreshAt(new Date("2026-08-21T18:00:00.000Z")).toISOString()).toBe("2026-08-22T06:00:00.000Z");
  });
});
