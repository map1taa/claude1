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
  username: varchar("username"),
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
  listName: text("list_name").notNull().default("あしあとリスト"),
  region: text("region").notNull().default("全国"),
  placeName: text("place_name").notNull(),
  url: text("url").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("spots_user_idx").on(table.userId),
]);

export const insertSpotSchema = createInsertSchema(spots).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertSpot = z.infer<typeof insertSpotSchema>;
export type Spot = typeof spots.$inferSelect;

// Profile update schema
export const updateProfileSchema = z.object({
  username: z.string().min(1, "ユーザーネームを入力してください").max(50, "ユーザーネームは50文字以内で入力してください"),
  bio: z.string().max(200, "ひとことプロフィールは200文字以内で入力してください").optional(),
});

export type UpdateProfile = z.infer<typeof updateProfileSchema>;

// User interactions table for recommendation system
export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  spotId: integer("spot_id").notNull().references(() => spots.id, { onDelete: "cascade" }),
  interactionType: varchar("interaction_type").notNull(), // 'view', 'like', 'save', 'share'
  interactionWeight: integer("interaction_weight").notNull().default(1), // Weight for recommendation scoring
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("interactions_user_idx").on(table.userId),
  index("interactions_spot_idx").on(table.spotId),
  index("interactions_type_idx").on(table.interactionType),
]);

export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = typeof userInteractions.$inferInsert;

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  preferredRegions: text("preferred_regions").array().default([]), // Array of preferred regions
  preferredCategories: text("preferred_categories").array().default([]), // Array of preferred spot categories
  interestTags: text("interest_tags").array().default([]), // Array of interest keywords
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("preferences_user_idx").on(table.userId),
]);

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

// Spot categories and tags for better recommendations
export const spotCategories = pgTable("spot_categories", {
  id: serial("id").primaryKey(),
  spotId: integer("spot_id").notNull().references(() => spots.id, { onDelete: "cascade" }),
  category: varchar("category").notNull(), // e.g., 'restaurant', 'cafe', 'museum', 'park'
  tags: text("tags").array().default([]), // Additional tags for detailed categorization
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("categories_spot_idx").on(table.spotId),
  index("categories_category_idx").on(table.category),
]);

export type SpotCategory = typeof spotCategories.$inferSelect;
export type InsertSpotCategory = typeof spotCategories.$inferInsert;
