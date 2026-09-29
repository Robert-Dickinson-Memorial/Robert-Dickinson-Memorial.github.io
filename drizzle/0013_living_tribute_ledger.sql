ALTER TABLE `tree_dedications` ADD COLUMN `provider` text NOT NULL DEFAULT 'Legacy provider';
ALTER TABLE `tree_dedications` ADD COLUMN `contribution_type` text NOT NULL DEFAULT 'tree';
ALTER TABLE `tree_dedications` ADD COLUMN `reported_tree_count` integer;
ALTER TABLE `tree_dedications` ADD COLUMN `count_basis` text;
ALTER TABLE `tree_dedications` ADD COLUMN `confirmation_ref` text;
ALTER TABLE `tree_dedications` ADD COLUMN `payment_confirmed` integer NOT NULL DEFAULT 1;
UPDATE `tree_dedications` SET `reported_tree_count` = `tree_count`, `count_basis` = 'legacy approved report' WHERE `reported_tree_count` IS NULL;
