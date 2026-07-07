import {
  users,
  spots,
  follows,
  listMembers,
  savedLists,
  type User,
  type UpsertUser,
  type Spot,
  type InsertSpot,
  type Follow,
  type InsertFollow,
  type ListMember,
  type UpdateProfile,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, ilike, inArray } from "drizzle-orm";
import { recommendationService, type RecommendationScore } from "./recommendationService";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateProfile(userId: string, profile: UpdateProfile): Promise<User>;
  searchUsers(query: string): Promise<User[]>;
  
  // Spot methods
  getAllSpots(): Promise<(Spot & { user: User })[]>;
  getUserSpots(userId: string): Promise<Spot[]>;
  getFollowingSpots(userId: string): Promise<(Spot & { user: User })[]>;
  createSpot(userId: string, spot: InsertSpot): Promise<Spot>;
  deleteSpot(userId: string, spotId: number): Promise<boolean>;
  updateListName(userId: string, oldListName: string, newListName: string, oldRegion: string, newRegion: string): Promise<void>;
  searchSpotsByTag(tag: string): Promise<(Spot & { user: User })[]>;
  
  // Follow methods
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  getFollowCounts(userId: string): Promise<{ followers: number; following: number }>;

  // Friend methods（友達申請）
  sendFriendRequest(requesterId: string, targetId: string): Promise<void>;
  getIncomingFriendRequests(userId: string): Promise<User[]>;
  acceptFriendRequest(userId: string, requesterId: string): Promise<boolean>;
  getFriends(userId: string): Promise<User[]>;
  areFriends(a: string, b: string): Promise<boolean>;

  // Shared list methods（共有リスト）
  getSpotById(spotId: number): Promise<Spot | undefined>;
  getListSpots(ownerId: string, listName: string, region: string): Promise<Spot[]>;
  addListMember(ownerId: string, listName: string, region: string, email: string): Promise<void>;
  getListMembers(ownerId: string, listName: string, region: string): Promise<ListMember[]>;
  removeListMember(ownerId: string, memberId: number): Promise<boolean>;
  isListMember(ownerId: string, listName: string, region: string, email: string): Promise<boolean>;
  getSharedListsForEmail(email: string): Promise<{ ownerId: string; listName: string; region: string; ownerName: string | null }[]>;

  // Saved list methods（保存済みリスト）
  saveList(userId: string, ownerId: string, listName: string, region: string): Promise<void>;
  unsaveList(userId: string, ownerId: string, listName: string, region: string): Promise<boolean>;
  getSavedLists(userId: string): Promise<{ id: number; ownerId: string; listName: string; region: string; ownerName: string | null }[]>;

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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async updateSpot(userId: string, spotId: number, data: { placeName?: string; url?: string; comment?: string }): Promise<boolean> {
    const result = await db
      .update(spots)
      .set(data)
      .where(and(eq(spots.id, spotId), eq(spots.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async updateListName(userId: string, oldListName: string, newListName: string, oldRegion: string, newRegion: string): Promise<void> {
    await db
      .update(spots)
      .set({ listName: newListName, region: newRegion })
      .where(
        and(
          eq(spots.userId, userId),
          eq(spots.listName, oldListName),
          eq(spots.region, oldRegion)
        )
      );
  }

  // Friend methods（友達申請）
  async sendFriendRequest(requesterId: string, targetId: string): Promise<void> {
    const existing = await db
      .select()
      .from(follows)
      .where(
        or(
          and(eq(follows.followerId, requesterId), eq(follows.followingId, targetId)),
          and(eq(follows.followerId, targetId), eq(follows.followingId, requesterId))
        )
      );
    if (existing.length > 0) return; // 申請済み or 既に友達
    await db.insert(follows).values({ followerId: requesterId, followingId: targetId, status: "pending" });
  }

  async getIncomingFriendRequests(userId: string): Promise<User[]> {
    const rows = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(and(eq(follows.followingId, userId), eq(follows.status, "pending")));
    return rows.map(r => r.user);
  }

  async acceptFriendRequest(userId: string, requesterId: string): Promise<boolean> {
    const result = await db
      .update(follows)
      .set({ status: "accepted" })
      .where(
        and(
          eq(follows.followerId, requesterId),
          eq(follows.followingId, userId),
          eq(follows.status, "pending")
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  async getFriends(userId: string): Promise<User[]> {
    const rows = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.status, "accepted"),
          or(eq(follows.followerId, userId), eq(follows.followingId, userId))
        )
      );
    const ids = rows.map(r => (r.followerId === userId ? r.followingId : r.followerId));
    if (ids.length === 0) return [];
    return await db.select().from(users).where(inArray(users.id, ids));
  }

  async areFriends(a: string, b: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.status, "accepted"),
          or(
            and(eq(follows.followerId, a), eq(follows.followingId, b)),
            and(eq(follows.followerId, b), eq(follows.followingId, a))
          )
        )
      );
    return rows.length > 0;
  }

  // Shared list methods（共有リスト）
  async getSpotById(spotId: number): Promise<Spot | undefined> {
    const [spot] = await db.select().from(spots).where(eq(spots.id, spotId));
    return spot;
  }

  async getListSpots(ownerId: string, listName: string, region: string): Promise<Spot[]> {
    return await db
      .select()
      .from(spots)
      .where(and(eq(spots.userId, ownerId), eq(spots.listName, listName), eq(spots.region, region)))
      .orderBy(desc(spots.createdAt));
  }

  async addListMember(ownerId: string, listName: string, region: string, email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const existing = await db
      .select()
      .from(listMembers)
      .where(
        and(
          eq(listMembers.ownerId, ownerId),
          eq(listMembers.listName, listName),
          eq(listMembers.region, region),
          eq(listMembers.email, normalized)
        )
      );
    if (existing.length > 0) return;
    await db.insert(listMembers).values({ ownerId, listName, region, email: normalized });
  }

  async getListMembers(ownerId: string, listName: string, region: string): Promise<ListMember[]> {
    return await db
      .select()
      .from(listMembers)
      .where(
        and(
          eq(listMembers.ownerId, ownerId),
          eq(listMembers.listName, listName),
          eq(listMembers.region, region)
        )
      );
  }

  async removeListMember(ownerId: string, memberId: number): Promise<boolean> {
    const result = await db
      .delete(listMembers)
      .where(and(eq(listMembers.id, memberId), eq(listMembers.ownerId, ownerId)));
    return (result.rowCount ?? 0) > 0;
  }

  async isListMember(ownerId: string, listName: string, region: string, email: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(listMembers)
      .where(
        and(
          eq(listMembers.ownerId, ownerId),
          eq(listMembers.listName, listName),
          eq(listMembers.region, region),
          eq(listMembers.email, email.trim().toLowerCase())
        )
      );
    return rows.length > 0;
  }

  async getSharedListsForEmail(email: string): Promise<{ ownerId: string; listName: string; region: string; ownerName: string | null }[]> {
    const rows = await db
      .select({ member: listMembers, owner: users })
      .from(listMembers)
      .innerJoin(users, eq(listMembers.ownerId, users.id))
      .where(eq(listMembers.email, email.trim().toLowerCase()));
    return rows.map(r => ({
      ownerId: r.member.ownerId,
      listName: r.member.listName,
      region: r.member.region,
      ownerName: r.owner.username || r.owner.email,
    }));
  }

  // Saved list methods（保存済みリスト）
  async saveList(userId: string, ownerId: string, listName: string, region: string): Promise<void> {
    const existing = await db
      .select()
      .from(savedLists)
      .where(
        and(
          eq(savedLists.userId, userId),
          eq(savedLists.ownerId, ownerId),
          eq(savedLists.listName, listName),
          eq(savedLists.region, region)
        )
      );
    if (existing.length > 0) return;
    await db.insert(savedLists).values({ userId, ownerId, listName, region });
  }

  async unsaveList(userId: string, ownerId: string, listName: string, region: string): Promise<boolean> {
    const result = await db
      .delete(savedLists)
      .where(
        and(
          eq(savedLists.userId, userId),
          eq(savedLists.ownerId, ownerId),
          eq(savedLists.listName, listName),
          eq(savedLists.region, region)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  async getSavedLists(userId: string): Promise<{ id: number; ownerId: string; listName: string; region: string; ownerName: string | null }[]> {
    const rows = await db
      .select({ saved: savedLists, owner: users })
      .from(savedLists)
      .innerJoin(users, eq(savedLists.ownerId, users.id))
      .where(eq(savedLists.userId, userId))
      .orderBy(desc(savedLists.createdAt));
    return rows.map(r => ({
      id: r.saved.id,
      ownerId: r.saved.ownerId,
      listName: r.saved.listName,
      region: r.saved.region,
      ownerName: r.owner.username || r.owner.email,
    }));
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
