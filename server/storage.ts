import { users, spots, type User, type InsertUser, type Spot, type InsertSpot } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Spot methods
  getAllSpots(): Promise<Spot[]>;
  createSpot(spot: InsertSpot): Promise<Spot>;
  deleteSpot(id: number): Promise<boolean>;
  searchSpotsByTag(tag: string): Promise<Spot[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private spots: Map<number, Spot>;
  private currentUserId: number;
  private currentSpotId: number;

  constructor() {
    this.users = new Map();
    this.spots = new Map();
    this.currentUserId = 1;
    this.currentSpotId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllSpots(): Promise<Spot[]> {
    return Array.from(this.spots.values()).sort((a, b) => b.id - a.id);
  }

  async createSpot(insertSpot: InsertSpot): Promise<Spot> {
    const id = this.currentSpotId++;
    const createdAt = new Date().toLocaleDateString('ja-JP');
    const spot: Spot = { 
      ...insertSpot, 
      id, 
      createdAt,
      tags: insertSpot.tags || []
    };
    this.spots.set(id, spot);
    return spot;
  }

  async searchSpotsByTag(tag: string): Promise<Spot[]> {
    return Array.from(this.spots.values())
      .filter(spot => spot.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())))
      .sort((a, b) => b.id - a.id);
  }

  async deleteSpot(id: number): Promise<boolean> {
    return this.spots.delete(id);
  }
}

export const storage = new MemStorage();
