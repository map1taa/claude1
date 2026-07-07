import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { extractInfoFromUrl } from "./urlExtractor";
import { insertSpotSchema, updateProfileSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // User routes
  app.get("/api/users/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = updateProfileSchema.parse(req.body);
      const user = await storage.updateProfile(userId, validatedData);
      res.json(user);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data provided" });
      } else {
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  });

  app.get("/api/users/:id/spots", isAuthenticated, async (req, res) => {
    try {
      const spots = await storage.getUserSpots(req.params.id);
      res.json(spots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user spots" });
    }
  });

  // Follow routes
  app.post("/api/users/:id/follow", isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.id;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const follow = await storage.followUser(followerId, followingId);
      res.status(201).json(follow);
    } catch (error) {
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/users/:id/follow", isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.id;
      
      const unfollowed = await storage.unfollowUser(followerId, followingId);
      if (unfollowed) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Follow relationship not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get("/api/users/:id/follow-status", isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.id;
      
      const isFollowing = await storage.isFollowing(followerId, followingId);
      res.json({ isFollowing });
    } catch (error) {
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  app.get("/api/users/:id/followers", isAuthenticated, async (req, res) => {
    try {
      const followers = await storage.getFollowers(req.params.id);
      res.json(followers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get("/api/users/:id/following", isAuthenticated, async (req, res) => {
    try {
      const following = await storage.getFollowing(req.params.id);
      res.json(following);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  app.get("/api/users/:id/follow-counts", isAuthenticated, async (req, res) => {
    try {
      const counts = await storage.getFollowCounts(req.params.id);
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch follow counts" });
    }
  });

  // Spot routes
  app.get("/api/spots", async (req, res) => {
    try {
      const spots = await storage.getAllSpots();
      res.json(spots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spots" });
    }
  });

  app.get("/api/spots/following", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const spots = await storage.getFollowingSpots(userId);
      res.json(spots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch following spots" });
    }
  });

  app.post("/api/spots", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertSpotSchema.parse(req.body);

      // 共有リスト: ownerId指定があり自分でない場合はメンバー権限を確認し、
      // オーナーのリストとしてスポットを作成する
      let targetUserId = userId;
      const ownerId = req.body.ownerId as string | undefined;
      if (ownerId && ownerId !== userId) {
        const me = await storage.getUser(userId);
        const allowed = me?.email
          ? await storage.isListMember(ownerId, validatedData.listName ?? "", validatedData.region ?? "", me.email)
          : false;
        if (!allowed) {
          return res.status(403).json({ message: "このリストを編集する権限がありません" });
        }
        targetUserId = ownerId;
      }

      const spot = await storage.createSpot(targetUserId, validatedData);
      res.status(201).json(spot);
    } catch (error) {
      console.error("Error creating spot:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data provided", error: error.message });
      } else {
        res.status(500).json({ message: "Failed to create spot", error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  });

  app.get("/api/spots/search", async (req, res) => {
    try {
      const tag = req.query.tag as string;
      if (!tag) {
        return res.status(400).json({ message: "Tag parameter is required" });
      }
      
      const spots = await storage.searchSpotsByTag(tag);
      res.json(spots);
    } catch (error) {
      res.status(500).json({ message: "Failed to search spots" });
    }
  });

  // 対象スポットをオーナー本人または共有メンバーとして操作できるか確認
  async function canEditSpot(userId: string, spot: { userId: string; listName: string; region: string }): Promise<boolean> {
    if (spot.userId === userId) return true;
    const me = await storage.getUser(userId);
    if (!me?.email) return false;
    return await storage.isListMember(spot.userId, spot.listName, spot.region, me.email);
  }

  app.delete("/api/spots/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid spot ID" });
      }

      const spot = await storage.getSpotById(id);
      if (!spot) {
        return res.status(404).json({ message: "Spot not found" });
      }
      if (!(await canEditSpot(userId, spot))) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const deleted = await storage.deleteSpot(spot.userId, id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Spot not found or not authorized" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete spot" });
    }
  });

  // Update a spot
  app.put("/api/spots/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid spot ID" });
      }

      const spot = await storage.getSpotById(id);
      if (!spot) {
        return res.status(404).json({ message: "Spot not found" });
      }
      if (!(await canEditSpot(userId, spot))) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { placeName, url, comment } = req.body;
      const updated = await storage.updateSpot(spot.userId, id, { placeName, url, comment });
      if (updated) {
        res.json({ message: "Spot updated successfully" });
      } else {
        res.status(404).json({ message: "Spot not found or not authorized" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update spot" });
    }
  });

  // Extract store info from URL
  app.post("/api/extract-url", isAuthenticated, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL is required" });
      }

      console.log(`[API] Extracting info from URL: ${url}`);
      const extractedInfo = await extractInfoFromUrl(url);
      console.log(`[API] Extracted info:`, extractedInfo);
      
      res.json(extractedInfo);
    } catch (error) {
      console.error("Error extracting URL info:", error);
      res.status(500).json({ message: "Failed to extract URL information" });
    }
  });

  // Update list name
  app.patch("/api/spots/update-list", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { oldListName, newListName, oldRegion, newRegion } = req.body;

      if (!oldListName || !newListName || !oldRegion || !newRegion) {
        return res.status(400).json({ message: "oldListName, newListName, oldRegion, and newRegion are required" });
      }

      await storage.updateListName(userId, oldListName, newListName, oldRegion, newRegion);
      res.json({ message: "List updated successfully" });
    } catch (error) {
      console.error("Error updating list:", error);
      res.status(500).json({ message: "Failed to update list" });
    }
  });



  // ============ 共有リンク（認証不要で閲覧可） ============
  app.get("/api/share/:ownerId/spots", async (req: any, res) => {
    try {
      const ownerId = req.params.ownerId;
      const listName = req.query.list as string;
      const region = req.query.region as string;
      if (!listName || !region) {
        return res.status(400).json({ message: "list and region are required" });
      }

      const owner = await storage.getUser(ownerId);
      if (!owner) {
        return res.status(404).json({ message: "List not found" });
      }

      const listSpots = await storage.getListSpots(ownerId, listName, region);

      // 編集権限: ログイン中のオーナー本人 or 招待済みメンバー
      let canEdit = false;
      let isOwner = false;
      const sessionUserId = (req.session as any)?.userId;
      if (sessionUserId) {
        if (sessionUserId === ownerId) {
          canEdit = true;
          isOwner = true;
        } else {
          const me = await storage.getUser(sessionUserId);
          if (me?.email) {
            canEdit = await storage.isListMember(ownerId, listName, region, me.email);
          }
        }
      }

      res.json({
        owner: { id: owner.id, name: owner.username || owner.email },
        spots: listSpots,
        canEdit,
        isOwner,
      });
    } catch (error) {
      console.error("Error fetching shared list:", error);
      res.status(500).json({ message: "Failed to fetch list" });
    }
  });

  // ============ 友達申請 ============
  app.post("/api/friends/request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetId } = req.body;
      if (!targetId || typeof targetId !== "string") {
        return res.status(400).json({ message: "targetId is required" });
      }
      if (targetId === userId) {
        return res.status(400).json({ message: "自分に友達申請はできません" });
      }
      const target = await storage.getUser(targetId);
      if (!target) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.sendFriendRequest(userId, targetId);
      res.json({ message: "友達申請を送りました" });
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.get("/api/friends/requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getIncomingFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post("/api/friends/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { requesterId } = req.body;
      if (!requesterId || typeof requesterId !== "string") {
        return res.status(400).json({ message: "requesterId is required" });
      }
      const accepted = await storage.acceptFriendRequest(userId, requesterId);
      if (accepted) {
        res.json({ message: "承認しました" });
      } else {
        res.status(404).json({ message: "申請が見つかりません" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.get("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  // 友達の全リスト（承認済みのみ）
  app.get("/api/friends/:id/spots", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friendId = req.params.id;
      if (!(await storage.areFriends(userId, friendId))) {
        return res.status(403).json({ message: "友達のみ閲覧できます" });
      }
      const friendSpots = await storage.getUserSpots(friendId);
      res.json(friendSpots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend spots" });
    }
  });

  // ============ 共有リストのメンバー管理（オーナーのみ） ============
  app.post("/api/list-members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { listName, region, email } = req.body;
      if (!listName || !region || !email || typeof email !== "string") {
        return res.status(400).json({ message: "listName, region, email are required" });
      }
      await storage.addListMember(userId, listName, region, email);
      const members = await storage.getListMembers(userId, listName, region);
      res.json(members);
    } catch (error) {
      console.error("Error adding list member:", error);
      res.status(500).json({ message: "Failed to add member" });
    }
  });

  app.get("/api/list-members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listName = req.query.list as string;
      const region = req.query.region as string;
      if (!listName || !region) {
        return res.status(400).json({ message: "list and region are required" });
      }
      const members = await storage.getListMembers(userId, listName, region);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.delete("/api/list-members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }
      const removed = await storage.removeListMember(userId, id);
      if (removed) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Member not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  // ============ 保存済みリスト（ブックマーク） ============
  app.get("/api/saved-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lists = await storage.getSavedLists(userId);
      res.json(lists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved lists" });
    }
  });

  app.post("/api/saved-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { ownerId, listName, region } = req.body;
      if (!ownerId || !listName || !region) {
        return res.status(400).json({ message: "ownerId, listName, region are required" });
      }
      if (ownerId === userId) {
        return res.status(400).json({ message: "自分のリストは保存できません" });
      }
      const owner = await storage.getUser(ownerId);
      if (!owner) {
        return res.status(404).json({ message: "List owner not found" });
      }
      await storage.saveList(userId, ownerId, listName, region);
      res.json({ message: "保存しました" });
    } catch (error) {
      console.error("Error saving list:", error);
      res.status(500).json({ message: "Failed to save list" });
    }
  });

  app.delete("/api/saved-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ownerId = req.query.ownerId as string;
      const listName = req.query.list as string;
      const region = req.query.region as string;
      if (!ownerId || !listName || !region) {
        return res.status(400).json({ message: "ownerId, list, region are required" });
      }
      const removed = await storage.unsaveList(userId, ownerId, listName, region);
      if (removed) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Saved list not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to unsave list" });
    }
  });

  // 自分に共有されているリスト一覧
  app.get("/api/shared-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const me = await storage.getUser(userId);
      if (!me?.email) {
        return res.json([]);
      }
      const lists = await storage.getSharedListsForEmail(me.email);
      res.json(lists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared lists" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
