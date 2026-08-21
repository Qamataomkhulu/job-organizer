ALTER TABLE `jobListings` ADD `sourceType` varchar(80) DEFAULT 'job-listing' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobListings` ADD `departmentName` varchar(320);--> statement-breakpoint
ALTER TABLE `jobListings` ADD `closingDate` timestamp;