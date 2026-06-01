# CreatorHub - Full Rebuild Plan

## Project Overview
Rebuild the complete CreatorHub application with 100% frontend/backend functionality.
The original source export was missing critical core files (localDb.ts, App.tsx, main.tsx, useAuth.ts, Navigation.tsx, ImageUpload.tsx, etc.). These must be reconstructed from usage patterns found across all page files.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Data Layer**: localStorage-based database (localDb.ts) - THE working data layer
- **Backend**: Hono + tRPC 11 + Drizzle ORM (pre-built, in the export)
- **Auth**: Dual - King password + Fan username/password
- **Routing**: HashRouter for static hosting

## Stage 1: Read Skill & Setup
- Load vibecoding-webapp-swarm skill
- Set up project scaffolding (package.json, configs, etc.)

## Stage 2: Core Infrastructure (Parallel)
- **localDb.ts**: Complete localStorage database with ALL types and functions referenced by pages
- **useAuth.ts**: Dual auth hook (King + Fan)
- **authEvents.ts**: Pub-sub for auth state
- **utils.ts**: Utility functions
- **trpc.tsx**: tRPC provider (localStorage mode - no backend needed)
- **use-mobile.ts**: Mobile detection hook
- **const.ts**: Constants

## Stage 3: Components (Parallel)
- **Navigation.tsx**: Full navigation with auth-aware links
- **ImageUpload.tsx**: Image upload with base64/preview
- **AuthLayout.tsx + AuthLayoutSkeleton.tsx**: Layout components (from export)

## Stage 4: Pages (Parallel batches)
- **Batch 1**: Home.tsx, Login.tsx, NotFound.tsx
- **Batch 2**: Feed.tsx, Shop.tsx, Messages.tsx
- **Batch 3**: Profile.tsx, Settings.tsx, Admin.tsx
- **Batch 4**: AIAgent.tsx, Leaderboard.tsx, Downloads.tsx

## Stage 5: Entry Points & Polish
- **App.tsx**: HashRouter with all routes, theme provider, toast provider
- **main.tsx**: Entry point
- **index.css**: Global styles with dark theme + CSS variables
- **App.css**: Additional styles
- shadcn/ui components setup

## Stage 6: Build & Deploy
- npm install
- npm run build
- Fix any errors
- Deploy

## Key Files from Export (ready to use)
- package.json, vite.config.ts, tailwind.config.js, tsconfig*.json
- index.html, .env.example, drizzle.config.ts, postcss.config.js
- All page files: Feed.tsx, Shop.tsx, Messages.tsx, Profile.tsx, Settings.tsx, Login.tsx, Admin.tsx, AIAgent.tsx, Leaderboard.tsx, Downloads.tsx, NotFound.tsx
- All backend API files in api/ and db/ and contracts/
- AuthLayout.tsx, AuthLayoutSkeleton.tsx

## Missing Files to Reconstruct
- src/main.tsx
- src/App.tsx
- src/App.css
- src/index.css
- src/const.ts
- src/lib/localDb.ts (CRITICAL - most complex)
- src/lib/authEvents.ts
- src/lib/utils.ts
- src/hooks/useAuth.ts
- src/hooks/use-mobile.ts
- src/providers/trpc.tsx
- src/components/layout/Navigation.tsx
- src/components/ImageUpload.tsx
- shadcn/ui components (install via CLI)
