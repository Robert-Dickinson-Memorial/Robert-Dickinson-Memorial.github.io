import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const memories = sqliteTable("memories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  email: text("email"),
  title: text("title").notNull(),
  story: text("story").notNull(),
  photoKey: text("photo_key"),
  photoName: text("photo_name"),
  status: text("status").notNull().default("pending"),
  consent: integer("consent", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const siteContent = sqliteTable("site_content", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  startAt: text("start_at").notNull(),
  endAt: text("end_at"),
  location: text("location"),
  description: text("description"),
  linkLabel: text("link_label"),
  linkUrl: text("link_url"),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_events_published_start").on(table.published, table.startAt)]);

export const galleryItems = sqliteTable("gallery_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  caption: text("caption"),
  objectKey: text("object_key"),
  externalUrl: text("external_url"),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_gallery_published_created").on(table.published, table.createdAt)]);

export const memorialEditors = sqliteTable("memorial_editors", {
  email: text("email").primaryKey(),
  displayName: text("display_name"),
  createdAt: text("created_at").notNull(),
});
