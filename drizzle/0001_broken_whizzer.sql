CREATE TABLE `jobListings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(80) NOT NULL,
	`externalId` varchar(160) NOT NULL,
	`sourceUrl` varchar(1024) NOT NULL,
	`title` varchar(512) NOT NULL,
	`employer` varchar(320) NOT NULL,
	`location` varchar(320) NOT NULL,
	`workMode` enum('remote','hybrid','onsite','unknown') NOT NULL DEFAULT 'unknown',
	`employmentType` varchar(160),
	`description` text NOT NULL,
	`tagsJson` text NOT NULL,
	`publishedAt` timestamp,
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobListings_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_listings_source_external_unique` UNIQUE(`source`,`externalId`)
);
--> statement-breakpoint
CREATE TABLE `jobMatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resumeId` int NOT NULL,
	`jobId` int NOT NULL,
	`score` int NOT NULL,
	`fitTier` enum('Priority','Strong','Selective') NOT NULL,
	`rationale` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobMatches_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_matches_resume_job_unique` UNIQUE(`resumeId`,`jobId`)
);
--> statement-breakpoint
CREATE TABLE `refreshRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(80) NOT NULL,
	`initiatedBy` enum('user','schedule') NOT NULL,
	`status` enum('running','completed','failed') NOT NULL,
	`jobsFetched` int NOT NULL DEFAULT 0,
	`error` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `refreshRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalFilename` varchar(255) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(1024) NOT NULL,
	`rawText` text NOT NULL,
	`profileJson` text NOT NULL,
	`strongestRoleFamily` varchar(160) NOT NULL,
	`masterCv` text NOT NULL,
	`careerGapGuidance` text NOT NULL,
	`salaryGuidance` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sourceConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(80) NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`status` enum('approved','pending','disabled') NOT NULL,
	`termsUrl` varchar(1024) NOT NULL,
	`adapterKind` varchar(120) NOT NULL,
	`dailyTaskUid` varchar(65),
	`lastRefreshAt` timestamp,
	`enabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sourceConfigs_id` PRIMARY KEY(`id`),
	CONSTRAINT `source_configs_source_unique` UNIQUE(`source`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `job_listings_source_seen_idx` ON `jobListings` (`source`,`lastSeenAt`);--> statement-breakpoint
CREATE INDEX `job_matches_user_score_idx` ON `jobMatches` (`userId`,`score`);--> statement-breakpoint
CREATE INDEX `refresh_runs_source_started_idx` ON `refreshRuns` (`source`,`startedAt`);--> statement-breakpoint
CREATE INDEX `resumes_user_created_idx` ON `resumes` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `source_configs_daily_task_idx` ON `sourceConfigs` (`dailyTaskUid`);