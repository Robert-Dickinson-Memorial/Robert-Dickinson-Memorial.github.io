CREATE TABLE `tree_dedications` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `email` text,
  `project` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` text NOT NULL
);
CREATE INDEX `idx_tree_dedications_status` ON `tree_dedications` (`status`);
