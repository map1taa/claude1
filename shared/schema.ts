import {
  pgTable,
  text,
  serial,
  integer,
  varchar,
  timestamp,
  jsonb,
  index,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  location: varchar("location"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Follows table for user relationships
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("follows_follower_idx").on(table.followerId),
  index("follows_following_idx").on(table.followingId),
]);

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

// Updated spots table with user association
export const spots = pgTable("spots", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  region: text("region").notNull(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  comment: text("comment").notNull(),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("spots_user_idx").on(table.userId),
]);

export const insertSpotSchema = createInsertSchema(spots).omit({
  id: true,
  userId: true,
  createdAt: true,
  tags: true,
}).extend({
  tags: z.string().optional().transform((val) => 
    val ? val.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []
  ),
});

export type InsertSpot = z.infer<typeof insertSpotSchema>;
export type Spot = typeof spots.$inferSelect;

// Profile update schema
export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateProfile = z.infer<typeof updateProfileSchema>;
