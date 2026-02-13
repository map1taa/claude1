import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Local development: dummy user auto-login (no Replit Auth)
const DUMMY_USER_ID = "local-dev-user";

export async function setupAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "local-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // HTTP for local dev
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  // Upsert dummy user on startup
  await storage.upsertUser({
    id: DUMMY_USER_ID,
    email: "dev@localhost",
    firstName: "Dev",
    lastName: "User",
    profileImageUrl: null,
  });

  // Auto-login middleware: inject dummy user into every request
  app.use((req: any, _res, next) => {
    req.user = {
      claims: { sub: DUMMY_USER_ID },
      expires_at: Math.floor(Date.now() / 1000) + 86400,
    };
    req.isAuthenticated = () => true;
    next();
  });

  // Keep login/logout routes so the frontend doesn't break
  app.get("/api/login", (_req, res) => res.redirect("/"));
  app.get("/api/callback", (_req, res) => res.redirect("/"));
  app.get("/api/logout", (_req, res) => res.redirect("/"));
}

export const isAuthenticated: RequestHandler = (_req, _res, next) => {
  next(); // Always allow in local dev
};
