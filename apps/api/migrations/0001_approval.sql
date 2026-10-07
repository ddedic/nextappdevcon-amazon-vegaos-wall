ALTER TABLE `photos` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `photos` ADD `approved_at` integer;--> statement-breakpoint
CREATE INDEX `photos_status_created_at_idx` ON `photos` (`status`,`created_at`);