import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSpotSchema, updateProfileSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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
      console.log("Creating spot for user:", userId);
      console.log("Request body:", req.body);
      
      const validatedData = insertSpotSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      const spot = await storage.createSpot(userId, validatedData);
      console.log("Created spot:", spot);
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

  app.delete("/api/spots/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid spot ID" });
      }
      
      const deleted = await storage.deleteSpot(userId, id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Spot not found or not authorized" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete spot" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
