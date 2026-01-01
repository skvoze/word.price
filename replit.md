# replit.md

## Overview

This is a Telegram Mini App for task pledging and accountability. Users create tasks with monetary pledges that they forfeit if they fail to complete them. The app features a dual-role system where regular users create and complete pledged tasks, while admins verify submitted evidence. Built as a full-stack TypeScript application with React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Telegram-inspired dark theme
- **Animations**: Framer Motion for page transitions and interactions
- **File Uploads**: Uppy with AWS S3 presigned URL flow

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: REST endpoints defined in `shared/routes.ts` with Zod validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Build**: Vite for frontend, esbuild for server bundling

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Drizzle Kit with `drizzle-kit push` command
- **Tables**: 
  - `users` - Telegram user accounts with balance and role
  - `tasks` - Pledged tasks with status tracking
  - `conversations` / `messages` - AI chat integration tables

### Authentication
- **Method**: Telegram Mini App context (no traditional auth)
- **Implementation**: `x-telegram-id` header passed from frontend
- **Test Mode**: `localStorage.testTelegramId` for development testing
- **Roles**: "user" and "admin" roles for different UI views

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including shadcn/ui
    pages/        # Route pages (Home, CreateTask, Verify, etc.)
    hooks/        # Custom React hooks for data fetching
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API route definitions
  storage.ts      # Database access layer
  replit_integrations/  # AI and object storage integrations
shared/           # Shared code between frontend and backend
  schema.ts       # Drizzle database schema
  routes.ts       # API route contracts with Zod schemas
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with schema defined in `shared/schema.ts`

### AI Services (Replit Integrations)
- **OpenAI API**: Chat completion and image generation via `AI_INTEGRATIONS_OPENAI_API_KEY`
- **Base URL**: Custom endpoint via `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Object Storage
- **Google Cloud Storage**: File uploads via Replit sidecar proxy
- **Presigned URLs**: Two-step upload flow (request URL → direct upload)
- **Endpoint**: Local sidecar at `http://127.0.0.1:1106`

### Frontend Dependencies
- **Uppy**: File upload management with S3 integration
- **date-fns**: Date formatting and manipulation
- **Radix UI**: Accessible UI primitives for shadcn/ui components
- **Framer Motion**: Animation library for page transitions

### Development
- **Vite**: Frontend dev server with HMR
- **Replit Plugins**: Error overlay, cartographer, and dev banner for Replit environment