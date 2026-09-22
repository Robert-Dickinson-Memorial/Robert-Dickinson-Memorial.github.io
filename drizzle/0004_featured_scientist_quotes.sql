ALTER TABLE memories ADD COLUMN featured_quote integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE memories ADD COLUMN quote_excerpt text;
--> statement-breakpoint
CREATE INDEX idx_memories_featured_quote ON memories (status, featured_quote, created_at);
