import type { Express, Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { ENV } from "../_core/env";
import * as db from "../db";
import { ensureConfiguredSources, refreshAdzunaCacheForAllUsers, refreshGovernmentDepartmentsForAllUsers, refreshJobicyForAllUsers } from "./service";

async function isAuthorizedCron(req: Request) {
  const auth = req.headers.authorization;
  if (ENV.cronSecret && auth === `Bearer ${ENV.cronSecret}`) return true;
  try { const user = await sdk.authenticateRequest(req); return Boolean(user.isCron && user.taskUid); } catch { return false; }
}
export function registerScheduledRefreshRoute(app: Express) {
  app.post("/api/scheduled/daily-vacancy-refresh", async (req: Request, res: Response) => {
    try {
      await ensureConfiguredSources();
      if (!(await isAuthorizedCron(req))) return res.status(403).json({ error: "cron-only" });
      const source = (await db.getSourceConfigs()).find(item => item.source === "jobicy");
      if (!source || source.source !== "jobicy" || source.status !== "approved" || source.enabled !== 1) {
        return res.json({ ok: true, skipped: "source-not-enabled" });
      }
      const result = await refreshJobicyForAllUsers();
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Scheduled refresh failed.",
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.post("/api/scheduled/twice-daily-adzuna-cache-refresh", async (req: Request, res: Response) => {
    try {
      await ensureConfiguredSources();
      if (!(await isAuthorizedCron(req))) return res.status(403).json({ error: "cron-only" });
      const source = (await db.getSourceConfigs()).find(item => item.source === "adzuna");
      if (!source || source.source !== "adzuna" || source.status !== "approved" || source.enabled !== 1) {
        return res.json({ ok: true, skipped: "source-not-enabled" });
      }
      const result = await refreshAdzunaCacheForAllUsers();
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Twice-daily Adzuna cache refresh failed.",
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.post("/api/scheduled/weekly-government-department-refresh", async (req: Request, res: Response) => {
    try {
      await ensureConfiguredSources();
      if (!(await isAuthorizedCron(req))) return res.status(403).json({ error: "cron-only" });
      const source = (await db.getSourceConfigs()).find(item => item.source === "gov-department");
      if (!source || source.source !== "gov-department" || source.status !== "approved" || source.enabled !== 1) {
        return res.json({ ok: true, skipped: "source-not-enabled" });
      }
      const result = await refreshGovernmentDepartmentsForAllUsers();
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Weekly government refresh failed.",
        timestamp: new Date().toISOString(),
      });
    }
  });
}
