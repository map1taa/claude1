import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSpotSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all spots
  app.get("/api/spots", async (req, res) => {
    try {
      const spots = await storage.getAllSpots();
      res.json(spots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spots" });
    }
  });

  // Create a new spot
  app.post("/api/spots", async (req, res) => {
    try {
      const validatedData = insertSpotSchema.parse(req.body);
      const spot = await storage.createSpot(validatedData);
      res.status(201).json(spot);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid data provided" });
      } else {
        res.status(500).json({ message: "Failed to create spot" });
      }
    }
  });

  // Delete a spot
  app.delete("/api/spots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid spot ID" });
      }
      
      const deleted = await storage.deleteSpot(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Spot not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete spot" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
