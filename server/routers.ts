import { z } from "zod";
import { parse as parseCookie } from "cookie";
import * as db from "./db";
import { createHeartbeatJob, listHeartbeatJobs, updateHeartbeatJob } from "./_core/heartbeat";
import { createLatestOutputPackage, ensureConfiguredSources, ensureJobicySource, refreshJobicyAndRankForResume, refreshJobicyAndRankForUser } from "./jobOrganizer/service";
import { exploreRoleFamilies, historyTitles } from "./jobOrganizer/careerDirection";
import type { ResumeProfile } from "./jobOrganizer/types";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      await ensureConfiguredSources();
      const [latestResume, resumes, matches, sources, latestRefresh] = await Promise.all([
        db.getLatestResumeForUser(ctx.user.id),
        db.listResumesForUser(ctx.user.id),
        db.listMatchesForUser(ctx.user.id, 25),
        db.getSourceConfigs(),
        db.getLatestRefresh(),
      ]);
      const publicSources = sources.map(({ accessNotes: _accessNotes, dailyTaskUid: _dailyTaskUid, ...source }) => source);
      return { latestResume, resumes, matches, sources: publicSources, latestRefresh };
    }),
  }),
  jobs: router({
    refresh: protectedProcedure.mutation(async ({ ctx }) => refreshJobicyAndRankForUser(ctx.user.id)),
    list: protectedProcedure.input(z.object({ limit: z.number().min(1).max(25).default(25) })).query(({ ctx, input }) => db.listMatchesForUser(ctx.user.id, input.limit)),
  }),
  outputs: router({
    generate: protectedProcedure.mutation(async ({ ctx }) => createLatestOutputPackage(ctx.user.id)),
  }),
  career: router({
    direction: protectedProcedure.query(async ({ ctx }) => {
      const resume = await db.getLatestResumeForUser(ctx.user.id);
      if (!resume) return null;
      const profile = JSON.parse(resume.profileJson) as ResumeProfile;
      return { preferredTitles: profile.targetRoleTitles, employmentTitles: historyTitles(profile), paths: exploreRoleFamilies(profile) };
    }),
    updatePreferredTitles: protectedProcedure.input(z.object({ titles: z.array(z.string().trim().min(2).max(120)).min(1).max(12) })).mutation(async ({ ctx, input }) => {
      const resume = await db.getLatestResumeForUser(ctx.user.id);
      if (!resume) throw new Error("Upload a résumé before selecting preferred job titles.");
      const profile = JSON.parse(resume.profileJson) as ResumeProfile;
      const titles = Array.from(new Set(input.titles.map(title => title.trim())));
      profile.targetRoleTitles = titles;
      await db.updateResumeProfileForUser(resume.id, ctx.user.id, JSON.stringify(profile));
      const refreshed = await refreshJobicyAndRankForResume(ctx.user.id, resume.id, "user");
      return { preferredTitles: titles, matched: refreshed.matched, fetched: refreshed.fetched };
    }),
  }),
  privacy: router({
    deleteCareerData: protectedProcedure.input(z.object({ confirmation: z.literal("DELETE") })).mutation(async ({ ctx }) => {
      return db.deleteCareerDataForUser(ctx.user.id);
    }),
  }),
  admin: router({
    listSources: adminProcedure.query(async () => {
      await ensureConfiguredSources();
      return db.getSourceConfigs();
    }),
    updateSource: adminProcedure.input(z.object({
      source: z.string().min(1).max(80),
      status: z.enum(["approved", "pending", "disabled"]),
      termsUrl: z.string().url(),
      adapterKind: z.string().min(1).max(120),
      rateLimit: z.string().min(1).max(120),
      accessNotes: z.string().min(1).max(5000),
      enabled: z.boolean(),
    })).mutation(({ input }) => db.updateSourceConfig(input.source, { ...input, enabled: input.enabled ? 1 : 0 })),
    dailyRefreshStatus: adminProcedure.query(async () => {
      const source = await ensureJobicySource();
      if (!source.dailyTaskUid) return null;
      const schedules = await listHeartbeatJobs("");
      const jobs = Array.isArray(schedules?.jobs) ? schedules.jobs : [];
      return jobs.find(schedule => schedule.taskUid === source.dailyTaskUid) ?? null;
    }),
    enableDailyJobicyRefresh: adminProcedure.mutation(async ({ ctx }) => {
      const source = await ensureJobicySource();
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const jobConfig = {
        name: "job-organizer-daily-jobicy-refresh",
        cron: "0 0 5 * * *",
        path: "/api/scheduled/daily-vacancy-refresh",
        description: "Daily approved Jobicy vacancy refresh and profile re-ranking",
      } as const;
      if (source.dailyTaskUid) {
        const updated = await updateHeartbeatJob(source.dailyTaskUid, { cron: jobConfig.cron, path: jobConfig.path, enable: true, description: jobConfig.description }, sessionToken);
        return { nextExecutionAt: updated.nextExecutionAt ?? null };
      }
      const created = await createHeartbeatJob(jobConfig, sessionToken);
      await db.setSourceDailyTaskUid("jobicy", created.taskUid, created.nextExecutionAt ? new Date(created.nextExecutionAt) : undefined);
      return { nextExecutionAt: created.nextExecutionAt ?? null };
    }),
  }),
});

export type AppRouter = typeof appRouter;
