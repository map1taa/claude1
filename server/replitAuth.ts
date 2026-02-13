import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import crypto from "crypto";

export async function setupAuth(app: Express) {
  // Trust proxy for Railway (HTTPS behind reverse proxy)
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "local-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
    })
  );

  // Register with email
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "メールアドレスを入力してください" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if email already exists
      const existing = await storage.getUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(400).json({ message: "このメールアドレスは既に登録されています" });
      }

      // Create user
      const id = crypto.randomUUID();
      const user = await storage.upsertUser({
        id,
        email: normalizedEmail,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
      });

      // Set session
      (req.session as any).userId = user.id;

      res.json(user);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "登録に失敗しました" });
    }
  });

  // Login with email
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "メールアドレスを入力してください" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await storage.getUserByEmail(normalizedEmail);

      if (!user) {
        return res.status(401).json({ message: "このメールアドレスは登録されていません" });
      }

      // Set session
      (req.session as any).userId = user.id;

      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "ログインに失敗しました" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "ログアウトに失敗しました" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "ログアウトしました" });
    });
  });

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(user);
  });

  // Keep old routes as redirects
  app.get("/api/login", (_req, res) => res.redirect("/"));
  app.get("/api/callback", (_req, res) => res.redirect("/"));
  app.get("/api/logout", (_req, res) => res.redirect("/"));
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Attach user info for route handlers
  req.user = { claims: { sub: userId } };
  next();
};
