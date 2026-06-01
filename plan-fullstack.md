# Full-Stack Conversion Plan

## Goal: Convert from static frontend → real full-stack app

### Stage 1: Database Layer (SQLite + Drizzle)
- Switch from localStorage to SQLite (file-based, no external DB server needed)
- Keep the existing Drizzle schema from the codebase
- Create database initialization and connection
- Seed the database with initial data

### Stage 2: Backend Server (Hono)
- Set up Hono server with proper CORS
- Wire all 16 tRPC routers to use real database queries
- Implement proper authentication (JWT, bcrypt password hashing)
- OAuth callback handlers for Kimi login
- File upload endpoint for images

### Stage 3: Frontend → Real API
- Replace localStorageLink with httpBatchLink pointing to local backend
- Update all pages to use real tRPC calls
- Remove localStorage data layer fallback

### Stage 4: PayPal Integration
- Server: Create PayPal order/capture endpoints
- Client: PayPal SDK for donation payments and shop purchases
- Webhook handler for payment confirmation

### Stage 5: Email Notifications
- Integrate Resend (or similar) for transactional emails
- Welcome email, purchase confirmation, donation thank you
- Order status updates

### Stage 6: Build & Package for Deployment
- Create Dockerfile for containerized deployment
- Build scripts for production
- Environment variable configuration
- Deployment-ready package

### Architecture After Conversion:
```
┌──────────────┐     HTTP/API     ┌──────────────┐     SQL      ┌──────────┐
│  React SPA   │ ◄──────────────► │ Hono Server  │ ◄──────────► │  SQLite  │
│  (Vite)      │                  │  + tRPC      │              │ (file)   │
└──────────────┘                  └──────────────┘              └──────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │ PayPal (sandbox) │
                              │ Email service    │
                              └──────────────────┘
```
