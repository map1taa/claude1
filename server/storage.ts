import {
  users,
  spots,
  follows,
  type User,
  type UpsertUser,
  type Spot,
  type InsertSpot,
  type Follow,
  type InsertFollow,
  type UpdateProfile,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, ilike } from "drizzle-orm";
import { recommendationService, type RecommendationScore } from "./recommendationService";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateProfile(userId: string, profile: UpdateProfile): Promise<User>;
  searchUsers(query: string): Promise<User[]>;
  
  // Spot methods
  getAllSpots(): Promise<(Spot & { user: User })[]>;
  getUserSpots(userId: string): Promise<Spot[]>;
  getFollowingSpots(userId: string): Promise<(Spot & { user: User })[]>;
  createSpot(userId: string, spot: InsertSpot): Promise<Spot>;
  deleteSpot(userId: string, spotId: number): Promise<boolean>;
  updateListName(userId: string, oldListName: string, newListName: string, region: string): Promise<void>;
  searchSpotsByTag(tag: string): Promise<(Spot & { user: User })[]>;
  
  // Follow methods
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  getFollowCounts(userId: string): Promise<{ followers: number; following: number }>;
  
  // Recommendation methods
  getPersonalizedRecommendations(userId: string, limit?: number): Promise<RecommendationScore[]>;
  recordInteraction(userId: string, spotId: number, interactionType: string): Promise<void>;
  updateUserPreferences(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateProfile(userId: string, profile: UpdateProfile): Promise<User> {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (profile.username) {
      updateData.username = profile.username;
    }
    
    if (profile.bio !== undefined) {
      updateData.bio = profile.bio;
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        or(
          sql`${users.firstName} ILIKE ${`%${query}%`}`,
          sql`${users.lastName} ILIKE ${`%${query}%`}`,
          sql`${users.email} ILIKE ${`%${query}%`}`
        )
      )
      .limit(20);
  }

  // Spot methods
  async getAllSpots(): Promise<(Spot & { user: User })[]> {
    const result = await db
      .select({
        id: spots.id,
        userId: spots.userId,
        listName: spots.listName,
        region: spots.region,
        placeName: spots.placeName,
        url: spots.url,
        comment: spots.comment,
        createdAt: spots.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          location: users.location,
          isPublic: users.isPublic,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(spots)
      .innerJoin(users, eq(spots.userId, users.id))
      .where(eq(users.isPublic, true))
      .orderBy(desc(spots.createdAt));
    return result as (Spot & { user: User })[];
  }

  async getUserSpots(userId: string): Promise<Spot[]> {
    return await db
      .select()
      .from(spots)
      .where(eq(spots.userId, userId))
      .orderBy(desc(spots.createdAt));
  }

  async getFollowingSpots(userId: string): Promise<(Spot & { user: User })[]> {
    const result = await db
      .select({
        id: spots.id,
        userId: spots.userId,
        listName: spots.listName,
        region: spots.region,
        placeName: spots.placeName,
        url: spots.url,
        comment: spots.comment,
        createdAt: spots.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          location: users.location,
          isPublic: users.isPublic,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(spots)
      .innerJoin(users, eq(spots.userId, users.id))
      .innerJoin(follows, eq(follows.followingId, spots.userId))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(spots.createdAt));
    return result as (Spot & { user: User })[];
  }

  async createSpot(userId: string, insertSpot: InsertSpot): Promise<Spot> {
    const [spot] = await db
      .insert(spots)
      .values({
        ...insertSpot,
        userId,
      })
      .returning();
    return spot;
  }

  async deleteSpot(userId: string, spotId: number): Promise<boolean> {
    const result = await db
      .delete(spots)
      .where(and(eq(spots.id, spotId), eq(spots.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async updateListName(userId: string, oldListName: string, newListName: string, region: string): Promise<void> {
    await db
      .update(spots)
      .set({ listName: newListName })
      .where(
        and(
          eq(spots.userId, userId),
          eq(spots.listName, oldListName),
          eq(spots.region, region)
        )
      );
  }

  async searchSpotsByTag(tag: string): Promise<(Spot & { user: User })[]> {
    const result = await db
      .select({
        id: spots.id,
        userId: spots.userId,
        listName: spots.listName,
        region: spots.region,
        placeName: spots.placeName,
        url: spots.url,
        comment: spots.comment,
        createdAt: spots.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          location: users.location,
          isPublic: users.isPublic,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(spots)
      .innerJoin(users, eq(spots.userId, users.id))
      .where(
        and(
          sql`${spots.listName} ILIKE ${`%${tag}%`}`,
          eq(users.isPublic, true)
        )
      )
      .orderBy(desc(spots.createdAt));
    return result as (Spot & { user: User })[];
  }

  // Follow methods
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    const [follow] = await db
      .insert(follows)
      .values({
        followerId,
        followingId,
      })
      .returning();
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    return !!follow;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        location: users.location,
        isPublic: users.isPublic,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    return result;
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bio: users.bio,
        location: users.location,
        isPublic: users.isPublic,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    return result;
  }

  async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    const [followersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, userId));

    const [followingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return {
      followers: followersResult.count,
      following: followingResult.count,
    };
  }

  // Recommendation methods
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<RecommendationScore[]> {
    return await recommendationService.getPersonalizedRecommendations(userId, limit);
  }

  async recordInteraction(userId: string, spotId: number, interactionType: string): Promise<void> {
    await recommendationService.recordInteraction(userId, spotId, interactionType);
    // Update user preferences based on new interaction
    await recommendationService.updateUserPreferences(userId);
  }

  async updateUserPreferences(userId: string): Promise<void> {
    await recommendationService.updateUserPreferences(userId);
  }
}

export const storage = new DatabaseStorage();
