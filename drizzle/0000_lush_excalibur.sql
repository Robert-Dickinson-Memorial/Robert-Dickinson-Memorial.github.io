CREATE TABLE `memories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`relationship` text NOT NULL,
	`email` text,
	`title` text NOT NULL,
	`story` text NOT NULL,
	`photo_key` text,
	`photo_name` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`consent` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
