import { desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  type InsertUser,
  jobListings,
  jobMatches,
  refreshRuns,
  resumes,
  sourceConfigs,
  type User,
  users,
  publicRateLimits,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import type { PublicJob, ScoredJob } from "./jobOrganizer/types";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function consumeRateLimit(fingerprintHash: string, maxRequests: number, windowMs: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const now = new Date();
  const existing = (await db.select().from(publicRateLimits).where(eq(publicRateLimits.fingerprintHash, fingerprintHash)).limit(1))[0];
  if (!existing || existing.expiresAt <= now) {
    await db.insert(publicRateLimits).values({ fingerprintHash, windowStartedAt: now, expiresAt: new Date(now.getTime() + windowMs), requestCount: 1 }).onDuplicateKeyUpdate({ set: { windowStartedAt: now, expiresAt: new Date(now.getTime() + windowMs), requestCount: 1 } });
    return true;
  }
  if (existing.requestCount >= maxRequests) return false;
  await db.update(publicRateLimits).set({ requestCount: existing.requestCount + 1 }).where(eq(publicRateLimits.fingerprintHash, fingerprintHash));
  return true;
}
export async function createResume(input: typeof resumes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(resumes).values(input);
  const id = Number(result[0].insertId);
  const created = await db.select().from(resumes).where(eq(resumes.id, id)).limit(1);
  return created[0]!;
}

export async function getLatestResumeForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.createdAt)).limit(1);
  return rows[0];
}

export async function getResumeByStorageKeyForUser(storageKey: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ id: resumes.id }).from(resumes).where(eq(resumes.storageKey, storageKey)).limit(1);
  return rows[0] ? rows[0] : undefined;
}
export async function getResumeByIdForUser(resumeId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(resumes).where(eq(resumes.id, resumeId)).limit(1);
  return rows[0]?.userId === userId ? rows[0] : undefined;
}

export async function updateResumeProfileForUser(resumeId: number, userId: number, profileJson: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const resume = await getResumeByIdForUser(resumeId, userId);
  if (!resume) throw new Error("Résumé not found.");
  await db.update(resumes).set({ profileJson }).where(eq(resumes.id, resumeId));
}

export async function listResumesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: resumes.id, originalFilename: resumes.originalFilename, strongestRoleFamily: resumes.strongestRoleFamily, createdAt: resumes.createdAt })
    .from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.createdAt));
}

export async function listLatestResumes(limit: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(resumes).orderBy(desc(resumes.createdAt)).limit(limit * 4);
  const seen = new Set<number>();
  return rows.filter(row => (seen.has(row.userId) ? false : (seen.add(row.userId), true))).slice(0, limit);
}

export async function ensureSourceConfig(input: Pick<typeof sourceConfigs.$inferInsert, "source" | "displayName" | "status" | "termsUrl" | "adapterKind" | "rateLimit" | "accessNotes" | "enabled">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(sourceConfigs).values(input).onDuplicateKeyUpdate({
    set: { source: input.source },
  });
  const rows = await db.select().from(sourceConfigs).where(eq(sourceConfigs.source, input.source)).limit(1);
  return rows[0]!;
}

export async function updateSourceConfig(source: string, input: Pick<typeof sourceConfigs.$inferInsert, "status" | "termsUrl" | "adapterKind" | "rateLimit" | "accessNotes"> & { enabled: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(sourceConfigs).set(input).where(eq(sourceConfigs.source, source));
  const rows = await db.select().from(sourceConfigs).where(eq(sourceConfigs.source, source)).limit(1);
  return rows[0];
}

export async function updateSourceMetadata(source: string, input: Pick<typeof sourceConfigs.$inferInsert, "displayName" | "status" | "termsUrl" | "adapterKind" | "rateLimit" | "accessNotes">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(sourceConfigs).set(input).where(eq(sourceConfigs.source, source));
  const rows = await db.select().from(sourceConfigs).where(eq(sourceConfigs.source, source)).limit(1);
  return rows[0];
}

export async function getSourceConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sourceConfigs).orderBy(desc(sourceConfigs.updatedAt));
}

export async function getSourceByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(sourceConfigs).where(eq(sourceConfigs.dailyTaskUid, taskUid)).limit(1);
  return rows[0];
}

export async function setSourceDailyTaskUid(source: string, taskUid: string, nextScheduledAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(sourceConfigs).set({ dailyTaskUid: taskUid, nextScheduledAt }).where(eq(sourceConfigs.source, source));
}

export async function markSourceRefreshed(source: string, nextScheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000)) {
  const db = await getDb();
  if (!db) return;
  await db.update(sourceConfigs).set({ lastRefreshAt: new Date(), nextScheduledAt }).where(eq(sourceConfigs.source, source));
}

export async function createRefreshRun(source: string, initiatedBy: "user" | "schedule") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(refreshRuns).values({ source, initiatedBy, status: "running" });
  return { id: Number(result[0].insertId) };
}

export async function completeRefreshRun(id: number, jobsFetched: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(refreshRuns).set({ status: "completed", jobsFetched, completedAt: new Date() }).where(eq(refreshRuns.id, id));
}

export async function failRefreshRun(id: number, error: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(refreshRuns).set({ status: "failed", error, completedAt: new Date() }).where(eq(refreshRuns.id, id));
}

export async function getLatestRefresh() {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(refreshRuns).orderBy(desc(refreshRuns.startedAt)).limit(1);
  return rows[0];
}

export async function upsertJobs(jobs: PublicJob[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  for (const job of jobs) {
    await db.insert(jobListings).values({
      source: job.source,
      sourceType: job.sourceType ?? "job-listing",
      externalId: job.externalId,
      sourceUrl: job.sourceUrl,
      title: job.title,
      employer: job.employer,
      departmentName: job.departmentName ?? null,
      location: job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      salaryText: job.salaryText ?? null,
      description: job.description.slice(0, 64000),
      tagsJson: JSON.stringify(job.tags),
      publishedAt: job.publishedAt,
      closingDate: job.closingDate ?? null,
      lastSeenAt: new Date(),
    }).onDuplicateKeyUpdate({
      set: {
        sourceUrl: job.sourceUrl,
        title: job.title,
        employer: job.employer,
        sourceType: job.sourceType ?? "job-listing",
        departmentName: job.departmentName ?? null,
        location: job.location,
        workMode: job.workMode,
        employmentType: job.employmentType,
        salaryText: job.salaryText ?? null,
        description: job.description.slice(0, 64000),
        tagsJson: JSON.stringify(job.tags),
        publishedAt: job.publishedAt,
        closingDate: job.closingDate ?? null,
        lastSeenAt: new Date(),
      },
    });
  }
}

export async function listCurrentJobs(sources: string | string[], limit: number) {
  const db = await getDb();
  if (!db) return [];
  const sourceList = Array.isArray(sources) ? sources : [sources];
  return db.select().from(jobListings).where(inArray(jobListings.source, sourceList)).orderBy(desc(jobListings.lastSeenAt)).limit(limit);
}

export async function replaceMatchesForResume(userId: number, resumeId: number, matches: Array<{ jobId: number } & ScoredJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(jobMatches).where(eq(jobMatches.userId, userId));
  if (matches.length > 0) {
    await db.insert(jobMatches).values(matches.map(match => ({
      userId,
      resumeId,
      jobId: match.jobId,
      score: match.score,
      fitTier: match.fitTier,
      rationale: match.rationale,
      evidenceTagsJson: JSON.stringify(match.evidenceTags),
    })));
  }
}

export async function listMatchesForUser(userId: number, limit: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ match: jobMatches, job: jobListings })
    .from(jobMatches)
    .innerJoin(jobListings, eq(jobMatches.jobId, jobListings.id))
    .where(eq(jobMatches.userId, userId))
    .orderBy(desc(jobMatches.score), desc(jobMatches.createdAt))
    .limit(limit);
}

export async function deleteCareerDataForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const userResumes = await db.select({ id: resumes.id }).from(resumes).where(eq(resumes.userId, userId));
  const deletedMatches = await db.delete(jobMatches).where(eq(jobMatches.userId, userId));
  await db.delete(resumes).where(eq(resumes.userId, userId));

  return {
    resumes: userResumes.length,
    matches: Number((deletedMatches as unknown as Array<{ affectedRows?: number }>)[0]?.affectedRows ?? 0),
    unreferencedFiles: userResumes.length,
  };
}
