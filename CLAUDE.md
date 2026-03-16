# CLAUDE.md — Vibe Coding (Northwestern Dining App)

A full-stack dining companion for Northwestern students. Browse dining hall menus, get AI-powered meal recommendations, and track daily macro intake.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Northwestern purple (purple-600) |
| Database | Supabase PostgreSQL via Drizzle ORM |
| Auth | NextAuth.js v5 (beta) with Google OAuth + Drizzle adapter |
| AI | Anthropic Claude (`claude-sonnet-4-5-20250929`) primary, OpenAI GPT-4o fallback |
| State | Zustand (persisted to localStorage) + React useState |
| Scraping | ZenRows proxy + Axios + Cheerio (dineoncampus.com) |

---

## Project Structure

```
/app                  - Next.js App Router pages and API routes
  /api
    /auth/[...nextauth] - NextAuth.js handler
    /meals/[id]         - DELETE a tracked meal
    /meals              - GET/POST tracked meals
    /profile            - GET/POST user profile
    /food-preferences   - GET/POST/DELETE food preferences
    /recommend          - POST: generate AI meal recommendations
  /auth/signin        - Google OAuth sign-in page
  /menu               - Main app page (protected)
    /components         - All UI components for the menu experience
    menu-explorer.tsx   - Root component: filters, tabs, modal state
    page.tsx            - Server entry point, session check

/lib
  /db
    schema.ts           - Drizzle table definitions (see Data Models)
    client.ts           - Postgres + Drizzle instance
  /stores
    meal-store.ts       - Zustand store for tracked meals (localStorage-persisted)
  /types
    user-profile.ts     - UserProfile type + TDEE/macro helpers
    meal-tracking.ts    - MenuItem, TrackedMeal, NutritionTotals, MacroProgress
  /utils
    macro-calculations.ts - Nutrition math utilities
  /dining-halls        - Dining hall schedules and metadata

/scripts              - DB migration/setup scripts
/supabase             - Supabase project config
```

---

## Key Components (`/app/menu/components/`)

| Component | Purpose |
|---|---|
| `menu-explorer.tsx` | Root: owns filter state, tab state, modal state, profile loading |
| `tab-navigation.tsx` | Tab bar: Explore / AI Recommendations / Today's Meals |
| `recommendations-tab.tsx` | Fetches + displays AI recommendations |
| `recommendation-card.tsx` | Card for a single recommendation with nutrition, tags, reasoning, "Add to Today" |
| `todays-meals-tab.tsx` | Tracked meals list + macro progress dashboard |
| `tracked-meal-card.tsx` | Single tracked meal with remove button |
| `macro-dashboard.tsx` | Progress bars for calories/protein/carbs/fat/sugar |
| `user-profile-modal.tsx` | Form: fitness goals, demographics, dietary restrictions |
| `user-menu.tsx` | Profile button + modal trigger |

---

## Data Models

### Database (`/lib/db/schema.ts`)
- `menuItems` — dining hall menu items with nutrition facts and dietary flags
- `userProfiles` — linked to NextAuth `users`; stores fitness goals, nutrition targets, demographics, dietary restrictions
- `trackedMeals` — per-user daily meal log; denormalized menu item data + timestamp
- `foodPreferences` — per-user food likes/dislikes
- `userPreferences` — legacy table (largely unused)
- NextAuth tables: `users`, `accounts`, `sessions`, `verificationTokens`

### TypeScript Types (`/lib/types/`)
- `UserProfile` — height/weight/age/gender, goal (`lose_weight` | `maintain` | `gain_muscle` | `gain_weight`), activity level, nutrition targets, dietary flags
  - `calculateTDEE(profile)` — Mifflin-St Jeor TDEE estimate
  - `calculateMacros(profile)` — macro targets by fitness goal
- `MenuItem` — full menu item with nutrition + dietary flags
- `TrackedMeal` — meal log entry (links to MenuItem + timestamp + source)
- `NutritionTotals` — aggregate calories/protein/carbs/fat/sugar
- `MacroProgress` — consumed/target/remaining per macro

---

## State Management

**Zustand (`/lib/stores/meal-store.ts`)** — persisted to `localStorage`:
- `meals` array, loading/syncing flags
- `fetchMealsForDate`, `addMeal` (optimistic), `removeMeal`, `getTotalsForDate`

**Component state** — tabs, filters, modals, search query live in `MenuExplorer` via `useState`.

**Server state** — all data persisted to Supabase via API routes; meal store syncs on mutation with optimistic updates + rollback on failure.

---

## API Routes

### `POST /api/recommend`
Generates AI meal recommendations. Payload:
```ts
{ userProfile, menuItems, consumedTotals, foodPreferences }
```
- Calls Claude (`claude-sonnet-4-5-20250929`) with a structured prompt
- Falls back to OpenAI GPT-4o on Claude failure
- Returns `MealRecommendation[]` with `title`, `items`, `reasoning`, `totalNutrition`

### `GET/POST /api/meals`
- GET: fetch tracked meals for a date (`?date=YYYY-MM-DD`)
- POST: add a tracked meal

### `DELETE /api/meals/[id]`
Remove a tracked meal by ID.

### `GET/POST /api/profile`
User profile CRUD (upserts on POST).

### `GET/POST/DELETE /api/food-preferences`
Manage food likes/dislikes.

---

## Auth

- NextAuth.js v5 beta with Google OAuth
- JWT session strategy; user ID is attached to session
- `middleware.ts` protects `/menu/**`, redirects signed-in users away from `/auth/signin`
- `auth.ts` at root — NextAuth config with Drizzle adapter

---

## Environment Variables

```
DATABASE_URL                  - Supabase PostgreSQL connection string
NEXT_PUBLIC_SUPABASE_URL      - Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anon key
ANTHROPIC_API_KEY             - Claude API key
OPENAI_API_KEY                - GPT-4 fallback key
ZENROWS_API_KEY               - Proxy for scraping dineoncampus.com
GOOGLE_CLIENT_ID              - OAuth
GOOGLE_CLIENT_SECRET          - OAuth
AUTH_SECRET                   - NextAuth secret
```

---

## Common Commands

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to DB
npm run db:studio    # Drizzle Studio UI
```

---

## Conventions

- Path alias `@/*` maps to project root (e.g., `@/lib/db`)
- All imports use `@/` — no relative path climbing
- TypeScript strict mode enabled
- Tailwind utility classes only — no CSS modules
- API routes return `Response` objects (Next.js App Router style)
- Meal store uses optimistic updates; always roll back on API error
