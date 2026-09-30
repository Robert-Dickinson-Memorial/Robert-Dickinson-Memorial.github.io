ALTER TABLE `tree_dedications` ADD COLUMN `geographic_scope` text NOT NULL DEFAULT 'legacy';
ALTER TABLE `tree_dedications` ADD COLUMN `geographic_label` text;
UPDATE `tree_dedications` SET `geographic_label` = `project` WHERE `geographic_label` IS NULL;
