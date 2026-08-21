import type { Express, Request, Response } from "express";
import { sdk } from "../_core/sdk";
import * as db from "../db";
import { refreshAdzunaCacheForAllUsers, refreshGovernmentDepartmentsForAllUsers, refreshJobicyForAllUsers } from "./service";

export function registerScheduledRefreshRoute(app: Express) {
  app.post("/api/scheduled/daily-vacancy-refresh", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const source = await db.getSourceByTaskUid(user.taskUid);
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
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const source = await db.getSourceByTaskUid(user.taskUid);
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
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const source = await db.getSourceByTaskUid(user.taskUid);
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
