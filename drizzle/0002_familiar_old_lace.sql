CREATE INDEX `idx_events_published_start` ON `events` (`published`,`start_at`);--> statement-breakpoint
CREATE INDEX `idx_gallery_published_created` ON `gallery_items` (`published`,`created_at`);--> statement-breakpoint
PRAGMA optimize;
