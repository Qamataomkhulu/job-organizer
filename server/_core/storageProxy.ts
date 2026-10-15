import type { Express, Request, Response } from "express";
import { ENV } from "./env";
import { sdk } from "./sdk";

function isSafeStorageKey(key: string) {
  return !key.includes("\\") &&
    !key.includes("\0") &&
    key.split("/").every(segment => segment.length > 0 && segment !== "." && segment !== "..");
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req: Request, res: Response) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key || !isSafeStorageKey(key)) {
      res.status(400).send("Invalid storage key");
      return;
    }

    let user: Awaited<ReturnType<typeof sdk.authenticateRequest>>;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.status(401).send("Authentication required");
      return;
    }

    if (user.isCron) {
      res.status(403).send("Storage access denied");
      return;
    }

    // Résumés and generated career packages are private user data. Never
    // mint a signed URL for a key outside the authenticated user's namespace.
    if (!key.startsWith(`job-organizer/${user.id}/`)) {
      res.status(403).send("Storage access denied");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "private, no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
