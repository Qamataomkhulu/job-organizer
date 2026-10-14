import { describe, expect, it } from "vitest";

const hasAdzunaCredentials = Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);

describe("Adzuna credentials", () => {
  it.skipIf(!hasAdzunaCredentials)("authorises a lightweight South African job-search request", async () => {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    expect(appId, "ADZUNA_APP_ID must be configured").toBeTruthy();
    expect(appKey, "ADZUNA_APP_KEY must be configured").toBeTruthy();

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
