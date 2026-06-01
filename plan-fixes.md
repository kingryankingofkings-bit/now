# CreatorHub Fixes Plan

## Root Cause Analysis

### Issue 1: CRITICAL - tRPC uses HTTP backend (no data shows)
The `trpc.tsx` provider uses `httpBatchLink({ url: "/api/trpc" })` which tries to hit a backend server that doesn't exist in static deployment. ALL pages use `trpc.post.list.useQuery()` etc. - these all return empty because the HTTP requests fail. The seedData() correctly populates localStorage, but the tRPC client never reads from it.

**Fix**: Replace httpBatchLink with a custom `localStorageLink` that intercepts all tRPC calls and routes them to localDb functions.

### Issue 2: No Home/Landing page
Route "/" goes to Feed. The original has a rich Home page with hero glass card, polls, stats, latest drops, The Vault, social links wall, shop section.

**Fix**: Create Home.tsx with all these sections, matching the original design.

### Issue 3: King profile photo not persisting
The save function stores avatar/cover to `ch_king_profile` but the `user` object from `useAuth()` reads from `ch_user` which doesn't get updated. After refresh, the new photo disappears.

**Fix**: Update `ch_user` localStorage entry when King profile is saved, and sync the avatar to the auth user object.

### Issue 4: Missing Settings nav link
Original has Settings in main nav.

**Fix**: Add Settings to Navigation.tsx.

## Execution Plan
1. Fix trpc.tsx - create localStorageLink that routes all tRPC procedures
2. Fix Profile.tsx - update ch_user when King saves profile
3. Create Home.tsx - full landing page matching original
4. Fix Navigation.tsx - add Settings link, update routes
5. Build and deploy
