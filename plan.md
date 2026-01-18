# FlavorMap — Planning & Scaffolding

A crowdsourced map of local food favorites with emoji-based reviews.

Social, visual, and deliciously interactive.

> Constraint: planning + scaffolding only (no implementation code in this document).

---

## 1) Product Vision

### 1.1 Problem
People want quick, trustworthy, local food recommendations that feel lightweight and fun—without reading long reviews.

### 1.2 Solution
A map-first app where anyone can:
- Drop a “spot” (restaurant / food truck / stall / cafe)
- Add a short note + cuisine tags
- Leave an emoji-based rating/reaction
- Discover spots nearby and what’s trending

### 1.3 Guiding Principles
- Map-first, minimal friction
- Emoji-first sentiment (fast, fun)
- Social proof without essay-reviews
- Moderation and safety as first-class

---
## 2) Users & Roles

### 2.1 Primary Users
- Local Food Explorers
- Tourists and Visitors
- Foodies who want to view or see favourites quickly


### 2.2 Roles
- Anonymous visitor (browse only)
- Authenticated user (create spots, react, comment)
- Moderator/admin (remove abusive content, manage reports)

---

## 3) MVP Definition (1–2 hours target)

### 3.1 MVP Capabilities (from README, refined)
1. Interactive map with pins
2. Add a spot:
   - name
   - cuisine (single or multi)
   - short note
   - emoji rating
   - location (lat/lng)
3. Browse/filter spots

### 3.2 MVP Screens (wireframe-level)
- Home / Map
  - Map view
  - Search box (optional MVP)
  - Filters (cuisine, emoji)
  - “Add Spot” button
- Add Spot
  - Name
  - Cuisine selector
  - Note
  - Emoji rating
  - Pick location (tap map / use current center)
- Spot Details
  - Name, cuisine
  - Note
  - Emoji rating
  - Created time
  - Optional: createdBy display name

### 3.3 Definition of Done (MVP)
- New spots persist and appear on map after refresh
- Filtering works for at least cuisine and emoji
- Basic error states exist (invalid input, network failure)
- Data model is stable enough to extend

### 3.4 Non-goals for MVP
- Full text review system
- Complex feed/ranking algorithms
- Real-time chat
- Payments/reservations integrations

---

## 4) Emoji Review System (Core UX)

### 4.1 Two Options
**Option A: Single emoji rating per spot (simple MVP)**
- Each spot has a single “vibe emoji” (e.g., 😋, 🔥, 🤤)
- Pros: minimal UI, super fast
- Cons: not truly crowdsourced sentiment unless updated by others

**Option B: Emoji reactions aggregated (recommended post-MVP)**
- Users react with one emoji per spot (or multiple)
- Spot displays aggregated counts (e.g., 🔥 12, 😋 7)
- Pros: truly crowdsourced, social proof
- Cons: requires auth and anti-abuse controls

### 4.2 Emoji Set
Start with a constrained set to keep data clean:
- 🔥 (must-try)
- 😋 (tasty)
- 🤤 (crave)
- 💸 (pricey)
- 🥶 (overhyped)
- 🌱 (great vegan/veg)
- 🕒 (worth the wait)

(Expand later; keep an internal enum-like list.)

### 4.3 Display Rules
- On pins: show the leading emoji (Option A) or the top emoji (Option B)
- On details: show all reactions and counts (Option B)

---

## 5) Data Model (Scaffold)

This expands the README suggestion into a growth-friendly model.

### 5.1 Entities

#### `spots`
Minimum fields (MVP):
- `id`
- `name` (string)
- `lat` (number)
- `lng` (number)
- `cuisine` (string or string[])
- `emoji` (string; MVP Option A)
- `note` (string)
- `createdAt` (timestamp)
- `createdBy` (uid or null for anonymous)

Recommended additions (post-MVP):
- `photoUrls` (string[])
- `address` (string)
- `placeId` (string; if integrating Google Places later)
- `status` (active/removed/pending)
- `geoHash` or `geohash` (string; if using geo queries)

#### `users` (post-MVP)
- `uid`
- `displayName`
- `photoURL`
- `createdAt`
- `role` (user/mod/admin)

#### `reactions` (post-MVP Option B)
Two patterns:
- **Subcollection**: `spots/{spotId}/reactions/{uid}`
  - `emoji`
  - `createdAt`
- **Top-level**: `reactions` with `spotId`, `uid`

#### `reports` (post-MVP)
- `spotId`
- `reportedBy`
- `reason` (enum)
- `details` (string)
- `createdAt`
- `status` (open/closed)

### 5.2 Query Needs (drive model decisions)
MVP:
- Get all spots in current map bounds (or “nearby”)
- Filter by cuisine/emoji

Post-MVP:
- Trending (time-window + reactions count)
- User profile: spots created, reactions made

### 5.3 Geo Query Strategy (Leaflet + Firestore)
Firestore doesn’t support true geo-radius queries natively.
Scaffold options:
- MVP simplest: load recent spots (limit) and client-filter by bounds
- Better: geohash + bounding-box queries
- Best: dedicated geo lib or service (but avoid overkill early)

---

## 6) Architecture Options

### 6.1 Recommended Stack
- Frontend: React
- Map: Leaflet.js
- Backend: Firebase
  - Firestore (data)
  - Firebase Auth (identity)
  - Storage (photos, stretch)
  - Cloud Functions (moderation / aggregation, stretch)

### 6.2 Firebase vs REST API Decision
**Firebase Pros**
- Very fast to ship MVP
- Auth + database are integrated
- Good for realtime updates later

**Firebase Cons**
- Security rules complexity
- Geo queries need thought
- Cost can grow with reads

**REST Pros**
- Full control of querying and data shaping

**REST Cons**
- More setup (API server, auth, hosting)

Decision recommendation:
- Use Firebase for MVP, revisit if geo/ranking gets complex.

---

## 7) Security, Privacy, and Moderation (Scaffold)

### 7.1 Abuse Risks
- Spam pins
- Offensive notes
- Doxxing (posting private addresses)
- Brigading reactions

### 7.2 Baseline Controls
MVP-friendly controls:
- Rate limits (per user / per IP; easiest with Functions later)
- Basic validation (name length, note length, allowed emoji set)
- Report button (post-MVP) + soft-delete

### 7.3 Authentication Policy
- MVP: allow anonymous browsing; require login to add spots (recommended)
- Alternative: allow anonymous adds but mark as `pending` (adds moderation overhead)

### 7.4 Content Guidelines (for later docs)
- No hate/harassment
- No personal data
- No illegal content

---

## 8) UX Details (Scaffold)

### 8.1 Pin Clustering
- Consider clustering when zoomed out (post-MVP but valuable)

### 8.2 Filters
- Cuisine multi-select
- Emoji filter
- “Open now” is out of scope without Places integration

### 8.3 Spot Creation Flow
- Default to map center for location
- Provide a “Use my location” button if permissions granted

---

## 9) Stretch Goals (from README, expanded)

### 9.1 Login + User Profiles
- Display name
- View contributions

### 9.2 Photo Uploads
- Store in Firebase Storage
- Thumbnail generation via Cloud Functions (optional)

### 9.3 “Trending near me”
- Define trending score: reactions in last 7 days, weighted by freshness
- Need auth + reactions model

### 9.4 Social Layer Ideas
- Follow friends
- Lists / collections (e.g., “Best Tacos”) 
- Shareable links to a spot

---

## 10) Milestones & Roadmap

### Phase 0 — Planning (now)
- Confirm MVP choice: emoji rating vs reactions
- Confirm auth requirement for adding spots
- Confirm geo query approach for MVP

### Phase 1 — MVP Build
- Map + pin rendering
- Add spot flow
- Persist to DB
- Basic filtering

### Phase 2 — Quality + Safety
- Auth
- Validation + basic anti-spam
- Reporting + soft-delete

### Phase 3 — Social + Scale
- Reactions aggregation
- Trending
- Photo uploads
- Pin clustering

---

## 11) Open Questions (Decisions to Make)

1. Emoji system: single emoji per spot (MVP) vs aggregated reactions?
2. Do we require login to add a spot?
3. Should cuisine be single-select or multi-select?
4. What’s the initial geographic scope (city-only vs global)?
5. How to handle duplicates (same restaurant added twice)?
6. Do we integrate a places provider (Google Places) later?
7. Moderation: community reporting only, or admin dashboard?

---

## 12) Success Metrics (Lightweight)

MVP metrics:
- # of spots added
- % of users who add at least one spot
- Map interactions per session (pans/zooms, pin opens)

Post-MVP:
- # of reactions per spot
- Retention (7-day)
- Report rate and moderation turnaround
