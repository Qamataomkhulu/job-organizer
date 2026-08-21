CREATE TABLE `publicRateLimits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fingerprintHash` varchar(64) NOT NULL,
	`windowStartedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`requestCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publicRateLimits_id` PRIMARY KEY(`id`),
	CONSTRAINT `public_rate_limits_fingerprint_unique` UNIQUE(`fingerprintHash`)
);
--> statement-breakpoint
CREATE INDEX `public_rate_limits_expiry_idx` ON `publicRateLimits` (`expiresAt`);