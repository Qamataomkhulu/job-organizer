import { describe, expect, it } from "vitest";

describe.skipIf(!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY)("Adzuna credentials", () => {
  it("authorises a lightweight South African job-search request", async () => {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    expect(appId).toBeTruthy();
    expect(appKey).toBeTruthy();

    const params = new URLSearchParams({
      app_id: appId!,
      app_key: appKey!,
      what: "cybersecurity",
      results_per_page: "1",
      "content-type": "application/json",
    });
    const response = await fetch(`https://api.adzuna.com/v1/api/jobs/za/search/1?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    expect(response.status, "Adzuna credentials must authorise the search endpoint").toBe(200);
    const payload = await response.json() as { results?: unknown[] };
    expect(Array.isArray(payload.results)).toBe(true);
  }, 20_000);
});
