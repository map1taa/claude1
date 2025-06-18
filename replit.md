# Overview

This is a Japanese social spot recommendation application called "あしあと" (Ashiato). It's a full-stack web application that allows users to discover, share, and recommend favorite places/spots with a social networking component. The application features user authentication via Replit Auth, spot creation and management, user following system, and personalized recommendations.

# System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React with TypeScript, using Vite for development and building
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **Authentication**: Replit OpenID Connect (OIDC) authentication system
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

# Key Components

## Frontend Architecture
- **React SPA** with TypeScript and modern hooks
- **Component Library**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and Japanese font support (Noto Sans JP)
- **State Management**: TanStack Query for API calls and caching
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Wouter for lightweight client-side routing

## Backend Architecture
- **Express.js** server with TypeScript
- **Database Layer**: Drizzle ORM with PostgreSQL
- **Authentication**: Passport.js with OpenID Connect strategy for Replit Auth
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with consistent error handling

## Database Schema
The application uses four main tables:
- **users**: Store user profiles and authentication data
- **spots**: Store location recommendations with metadata
- **follows**: Manage user following relationships
- **sessions**: Handle session persistence for authentication

## Authentication System
- **Replit Auth Integration**: Uses OpenID Connect for seamless authentication
- **Session Management**: Persistent sessions stored in PostgreSQL
- **User Profile Management**: Automatic user creation and profile updates

# Data Flow

1. **Authentication Flow**: Users authenticate via Replit OIDC, sessions are stored in PostgreSQL
2. **Spot Creation**: Authenticated users can create spots with location, comments, and categorization
3. **Social Features**: Users can follow/unfollow others and view their spots
4. **Recommendations**: Personalized recommendations based on user preferences and social connections
5. **Real-time Updates**: Client state automatically updates via TanStack Query invalidation

# External Dependencies

## Core Framework Dependencies
- **React 18** with TypeScript for frontend
- **Express.js** for backend API server
- **Vite** for development and build tooling
- **Drizzle ORM** with PostgreSQL adapter

## UI and Styling
- **Tailwind CSS** with custom configuration
- **Radix UI** primitives for accessible components
- **shadcn/ui** component library
- **Lucide React** for icons

## Authentication and Session Management
- **Passport.js** with OpenID Client strategy
- **connect-pg-simple** for session storage
- **Replit Auth** integration via OIDC

## Development Tools
- **TypeScript** for type safety across the stack
- **ESBuild** for production server bundling
- **PostCSS** with Autoprefixer for CSS processing

# Deployment Strategy

## Development Environment
- **Local Development**: `npm run dev` starts both client and server with hot reloading
- **Database Management**: Drizzle Kit for schema migrations and database push
- **Environment**: Node.js 20 with ES modules support

## Production Deployment
- **Build Process**: Vite builds the client, ESBuild bundles the server
- **Deployment Target**: Replit autoscale deployment
- **Database**: PostgreSQL 16 with connection pooling via Neon
- **Static Assets**: Client assets served from Express server

## Configuration
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPL_ID for authentication
- **Port Configuration**: Default port 5000 mapped to external port 80
- **Build Artifacts**: Client builds to `dist/public`, server to `dist`

# Changelog

```
Changelog:
- June 18, 2025. Initial setup
```

# User Preferences

```
Preferred communication style: Simple, everyday language.
```