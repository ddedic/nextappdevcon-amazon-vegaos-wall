CREATE TABLE `auth_failures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_failures_ip_hash_created_at_idx` ON `auth_failures` (`ip_hash`,`created_at`);