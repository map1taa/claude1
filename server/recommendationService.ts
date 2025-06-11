import { db } from "./db";
import { eq, sql, and, desc, notInArray, inArray } from "drizzle-orm";
import { spots, users, follows, userInteractions, userPreferences, spotCategories } from "@shared/schema";
import type { Spot, User, UserInteraction, UserPreferences } from "@shared/schema";

export interface RecommendationScore {
  spot: Spot & { user: User };
  score: number;
  reasons: string[];
}

export class RecommendationService {
  
  // Get personalized recommendations for a user
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<RecommendationScore[]> {
    // Get user's existing spots to exclude from recommendations
    const userSpots = await db
      .select({ id: spots.id })
      .from(spots)
      .where(eq(spots.userId, userId));
    
    const userSpotIds = userSpots.map(s => s.id);

    // Get all available spots (excluding user's own spots)
    const availableSpots = await db
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
      .leftJoin(users, eq(spots.userId, users.id))
      .where(
        userSpotIds.length > 0 
          ? notInArray(spots.id, userSpotIds)
          : sql`1=1`
      );

    if (availableSpots.length === 0) {
      return [];
    }

    // Calculate recommendation scores for each spot
    const recommendations: RecommendationScore[] = [];
    
    for (const spotData of availableSpots) {
      const spot = {
        id: spotData.id,
        userId: spotData.userId,
        listName: spotData.listName,
        region: spotData.region,
        placeName: spotData.placeName,
        url: spotData.url,
        comment: spotData.comment,
        createdAt: spotData.createdAt,
        user: spotData.user as User
      };

      const score = await this.calculateRecommendationScore(userId, spot);
      recommendations.push(score);
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Calculate recommendation score for a specific spot
  private async calculateRecommendationScore(userId: string, spot: Spot & { user: User }): Promise<RecommendationScore> {
    let score = 0;
    const reasons: string[] = [];

    // 1. Social influence score (spots from followed users)
    const socialScore = await this.calculateSocialScore(userId, spot);
    score += socialScore.score;
    reasons.push(...socialScore.reasons);

    // 2. Regional preference score
    const regionalScore = await this.calculateRegionalScore(userId, spot);
    score += regionalScore.score;
    reasons.push(...regionalScore.reasons);

    // 3. Interaction pattern score
    const interactionScore = await this.calculateInteractionScore(userId, spot);
    score += interactionScore.score;
    reasons.push(...interactionScore.reasons);

    // 4. Content similarity score
    const contentScore = await this.calculateContentScore(userId, spot);
    score += contentScore.score;
    reasons.push(...contentScore.reasons);

    // 5. Recency boost
    const recencyScore = this.calculateRecencyScore(spot);
    score += recencyScore.score;
    reasons.push(...recencyScore.reasons);

    return {
      spot,
      score: Math.round(score * 100) / 100,
      reasons: reasons.filter(r => r.length > 0)
    };
  }

  // Calculate social influence score
  private async calculateSocialScore(userId: string, spot: Spot & { user: User }): Promise<{ score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let score = 0;

    // Check if spot is from a followed user
    const isFromFollowedUser = await db
      .select({ id: follows.id })
      .from(follows)
      .where(and(
        eq(follows.followerId, userId),
        eq(follows.followingId, spot.userId)
      ))
      .limit(1);

    if (isFromFollowedUser.length > 0) {
      score += 30;
      reasons.push("フォローしているユーザーのスポット");
    }

    // Boost score for spots with high interaction from followed users
    const followedUsersInteractions = await db
      .select({ count: sql<number>`count(*)` })
      .from(userInteractions)
      .leftJoin(follows, eq(userInteractions.userId, follows.followingId))
      .where(and(
        eq(follows.followerId, userId),
        eq(userInteractions.spotId, spot.id)
      ));

    const interactionCount = followedUsersInteractions[0]?.count || 0;
    if (interactionCount > 0) {
      score += Math.min(interactionCount * 5, 20);
      reasons.push("フォローしているユーザーがよく見ているスポット");
    }

    return { score, reasons };
  }

  // Calculate regional preference score
  private async calculateRegionalScore(userId: string, spot: Spot & { user: User }): Promise<{ score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let score = 0;

    // Get user's preferences
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (preferences.length > 0) {
      const userPrefs = preferences[0];
      if (userPrefs.preferredRegions && userPrefs.preferredRegions.includes(spot.region)) {
        score += 25;
        reasons.push(`好みの地域: ${spot.region}`);
      }
    }

    // Analyze user's historical regional preferences
    const userRegionalHistory = await db
      .select({ 
        region: spots.region,
        count: sql<number>`count(*)`
      })
      .from(spots)
      .where(eq(spots.userId, userId))
      .groupBy(spots.region)
      .orderBy(desc(sql`count(*)`));

    if (userRegionalHistory.length > 0) {
      const topRegion = userRegionalHistory[0];
      if (spot.region === topRegion.region) {
        score += 15;
        reasons.push("よく訪れている地域のスポット");
      }
    }

    return { score, reasons };
  }

  // Calculate interaction pattern score
  private async calculateInteractionScore(userId: string, spot: Spot & { user: User }): Promise<{ score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let score = 0;

    // Get user's interaction patterns
    const userInteractionPatterns = await db
      .select({
        listName: spots.listName,
        count: sql<number>`count(*)`
      })
      .from(userInteractions)
      .leftJoin(spots, eq(userInteractions.spotId, spots.id))
      .where(eq(userInteractions.userId, userId))
      .groupBy(spots.listName)
      .orderBy(desc(sql`count(*)`));

    if (userInteractionPatterns.length > 0) {
      const preferredListTypes = userInteractionPatterns.slice(0, 3);
      const matchingList = preferredListTypes.find(pattern => pattern.listName === spot.listName);
      
      if (matchingList) {
        score += 20;
        reasons.push("興味のあるリストタイプ");
      }
    }

    return { score, reasons };
  }

  // Calculate content similarity score
  private async calculateContentScore(userId: string, spot: Spot & { user: User }): Promise<{ score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let score = 0;

    // Analyze user's spot content for keywords
    const userSpots = await db
      .select()
      .from(spots)
      .where(eq(spots.userId, userId));

    if (userSpots.length > 0) {
      // Simple keyword matching in comments and place names
      const userKeywords = this.extractKeywords(userSpots);
      const spotKeywords = this.extractKeywords([spot]);
      
      const commonKeywords = userKeywords.filter(keyword => 
        spotKeywords.includes(keyword)
      );

      if (commonKeywords.length > 0) {
        score += Math.min(commonKeywords.length * 10, 25);
        reasons.push("似た興味の内容");
      }
    }

    return { score, reasons };
  }

  // Calculate recency score
  private calculateRecencyScore(spot: Spot & { user: User }): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    const now = new Date();
    const spotDate = spot.createdAt ? new Date(spot.createdAt) : new Date();
    const daysDiff = Math.floor((now.getTime() - spotDate.getTime()) / (1000 * 60 * 60 * 24));

    // Boost newer spots
    if (daysDiff <= 7) {
      score += 10;
      reasons.push("新しく追加されたスポット");
    } else if (daysDiff <= 30) {
      score += 5;
    }

    return { score, reasons };
  }

  // Extract keywords from spots for content analysis
  private extractKeywords(spots: Spot[]): string[] {
    const keywords: string[] = [];
    
    spots.forEach(spot => {
      // Extract keywords from comments and place names
      const text = `${spot.comment} ${spot.placeName}`.toLowerCase();
      
      // Common Japanese keywords for places
      const placeKeywords = [
        'カフェ', 'レストラン', '公園', '美術館', '博物館', 
        'ラーメン', '寿司', '焼肉', 'パン', 'スイーツ',
        '景色', '夜景', '桜', '紅葉', '海', '山', '川',
        'ショッピング', '買い物', '温泉', 'ホテル'
      ];
      
      placeKeywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          keywords.push(keyword);
        }
      });
    });

    return Array.from(new Set(keywords)); // Remove duplicates
  }

  // Record user interaction for future recommendations
  async recordInteraction(userId: string, spotId: number, interactionType: string): Promise<void> {
    const weight = this.getInteractionWeight(interactionType);
    
    await db.insert(userInteractions).values({
      userId,
      spotId,
      interactionType,
      interactionWeight: weight
    });
  }

  // Get interaction weight based on type
  private getInteractionWeight(interactionType: string): number {
    const weights: Record<string, number> = {
      'view': 1,
      'like': 3,
      'save': 5,
      'share': 7,
      'visit': 10
    };
    
    return weights[interactionType] || 1;
  }

  // Update user preferences based on interactions
  async updateUserPreferences(userId: string): Promise<void> {
    // Analyze user's interaction patterns to update preferences
    const regionPreferences = await db
      .select({
        region: spots.region,
        totalWeight: sql<number>`sum(${userInteractions.interactionWeight})`
      })
      .from(userInteractions)
      .leftJoin(spots, eq(userInteractions.spotId, spots.id))
      .where(eq(userInteractions.userId, userId))
      .groupBy(spots.region)
      .orderBy(desc(sql`sum(${userInteractions.interactionWeight})`))
      .limit(5);

    const preferredRegions = regionPreferences.map(r => r.region).filter((region): region is string => region !== null);

    // Update or insert user preferences
    const existingPrefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (existingPrefs.length > 0) {
      await db
        .update(userPreferences)
        .set({
          preferredRegions,
          updatedAt: new Date()
        })
        .where(eq(userPreferences.userId, userId));
    } else {
      await db.insert(userPreferences).values({
        userId,
        preferredRegions: preferredRegions,
        preferredCategories: [],
        interestTags: []
      });
    }
  }
}

export const recommendationService = new RecommendationService();