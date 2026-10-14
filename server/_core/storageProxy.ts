import type { Express } from "express";
import { ENV } from "./env";
import { storageGetSignedUrl } from "../storage";
import { sdk } from "./sdk";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const rawKey = (req.params as Record<string, string>)[0];
    const key = rawKey ? decodeURIComponent(rawKey) : "";
    if (!key || key.includes("..") || key.startsWith("/")) {
      res.status(400).send("Invalid storage key");
      return;
    }

    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.status(401).send("Authentication required");
      return;
    }
    if (!key.startsWith(`job-organizer/${user.id}/`)) {
      res.status(404).send("Storage object not found");
      return;
    }
    if (!ENV.s3Bucket) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const url = await storageGetSignedUrl(key);
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
