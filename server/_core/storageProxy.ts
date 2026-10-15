import type { Express, Request, Response } from "express";
import { ENV } from "./env";
import { storageGetSignedUrl } from "../storage";
import { sdk } from "./sdk";

function isSafeStorageKey(key: string) {
  const segments = key.split("/");
  return segments.every(segment =>
    segment.length > 0 &&
    segment !== "." &&
    segment !== ".." &&
    /^[A-Za-z0-9._-]+$/.test(segment)
  );
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req: Request, res: Response) => {
    // Express has already decoded route parameters; avoid decoding a second time.
    const key = (req.params as Record<string, string>)[0] ?? "";
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

    if (user.isCron || !key.startsWith(`job-organizer/${user.id}/`)) {
      // Avoid disclosing whether another user's object exists.
      res.status(404).send("Storage object not found");
      return;
    }

    if (!ENV.s3Bucket) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const url = await storageGetSignedUrl(key);
      res.set("Cache-Control", "private, no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
