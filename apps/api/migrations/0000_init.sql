CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`caption` text,
	`tribe` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`ip_hash` text NOT NULL,
	`delete_token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`removed_at` integer
);
--> statement-breakpoint
CREATE INDEX `photos_created_at_idx` ON `photos` (`created_at`);--> statement-breakpoint
CREATE INDEX `photos_ip_hash_created_at_idx` ON `photos` (`ip_hash`,`created_at`);