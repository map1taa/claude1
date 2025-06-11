import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const spots = pgTable("spots", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  comment: text("comment").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertSpotSchema = createInsertSchema(spots).omit({
  id: true,
  createdAt: true,
});

export type InsertSpot = z.infer<typeof insertSpotSchema>;
export type Spot = typeof spots.$inferSelect;

// Keep existing users table for compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
