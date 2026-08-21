import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const resumes = mysqlTable("resumes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1024 }).notNull(),
  rawText: text("rawText").notNull(),
  profileJson: text("profileJson").notNull(),
  strongestRoleFamily: varchar("strongestRoleFamily", { length: 160 }).notNull(),
  masterCv: text("masterCv").notNull(),
  careerGapGuidance: text("careerGapGuidance").notNull(),
  salaryGuidance: text("salaryGuidance").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userCreatedIndex: index("resumes_user_created_idx").on(table.userId, table.createdAt),
}));

export const sourceConfigs = mysqlTable("sourceConfigs", {
  id: int("id").autoincrement().primaryKey(),
  source: varchar("source", { length: 80 }).notNull(),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["approved", "pending", "disabled"]).notNull(),
  termsUrl: varchar("termsUrl", { length: 1024 }).notNull(),
  adapterKind: varchar("adapterKind", { length: 120 }).notNull(),
  rateLimit: varchar("rateLimit", { length: 120 }).notNull(),
  accessNotes: text("accessNotes").notNull(),
  dailyTaskUid: varchar("dailyTaskUid", { length: 65 }),
  lastRefreshAt: timestamp("lastRefreshAt"),
  nextScheduledAt: timestamp("nextScheduledAt"),
  enabled: int("enabled").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  sourceUnique: uniqueIndex("source_configs_source_unique").on(table.source),
  taskIndex: index("source_configs_daily_task_idx").on(table.dailyTaskUid),
}));

export const jobListings = mysqlTable("jobListings", {
  id: int("id").autoincrement().primaryKey(),
  source: varchar("source", { length: 80 }).notNull(),
  sourceType: varchar("sourceType", { length: 80 }).notNull().default("job-listing"),
  externalId: varchar("externalId", { length: 160 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1024 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  employer: varchar("employer", { length: 320 }).notNull(),
  departmentName: varchar("departmentName", { length: 320 }),
  location: varchar("location", { length: 320 }).notNull(),
  workMode: mysqlEnum("workMode", ["remote", "hybrid", "onsite", "unknown"]).notNull().default("unknown"),
  employmentType: varchar("employmentType", { length: 160 }),
  salaryText: varchar("salaryText", { length: 512 }),
  description: text("description").notNull(),
  tagsJson: text("tagsJson").notNull(),
  publishedAt: timestamp("publishedAt"),
  closingDate: timestamp("closingDate"),
  firstSeenAt: timestamp("firstSeenAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
}, table => ({
  sourceExternalUnique: uniqueIndex("job_listings_source_external_unique").on(table.source, table.externalId),
  sourceSeenIndex: index("job_listings_source_seen_idx").on(table.source, table.lastSeenAt),
}));

export const jobMatches = mysqlTable("jobMatches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resumeId: int("resumeId").notNull(),
  jobId: int("jobId").notNull(),
  score: int("score").notNull(),
  fitTier: mysqlEnum("fitTier", ["Priority", "Strong", "Selective"]).notNull(),
  rationale: text("rationale").notNull(),
  evidenceTagsJson: text("evidenceTagsJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  userScoreIndex: index("job_matches_user_score_idx").on(table.userId, table.score),
  resumeJobUnique: uniqueIndex("job_matches_resume_job_unique").on(table.resumeId, table.jobId),
}));

export const refreshRuns = mysqlTable("refreshRuns", {
  id: int("id").autoincrement().primaryKey(),
  source: varchar("source", { length: 80 }).notNull(),
  initiatedBy: mysqlEnum("initiatedBy", ["user", "schedule"]).notNull(),
  status: mysqlEnum("status", ["running", "completed", "failed"]).notNull(),
  jobsFetched: int("jobsFetched").notNull().default(0),
  error: text("error"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, table => ({
  sourceStartedIndex: index("refresh_runs_source_started_idx").on(table.source, table.startedAt),
}));

export const publicRateLimits = mysqlTable("publicRateLimits", {
  id: int("id").autoincrement().primaryKey(),
  fingerprintHash: varchar("fingerprintHash", { length: 64 }).notNull(),
  windowStartedAt: timestamp("windowStartedAt").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  requestCount: int("requestCount").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  fingerprintUnique: uniqueIndex("public_rate_limits_fingerprint_unique").on(table.fingerprintHash),
  expiryIndex: index("public_rate_limits_expiry_idx").on(table.expiresAt),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Resume = typeof resumes.$inferSelect;
export type JobListing = typeof jobListings.$inferSelect;
export type JobMatch = typeof jobMatches.$inferSelect;
