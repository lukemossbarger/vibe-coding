# Northwestern Dining Hall Meal Finder

A full-stack web app that helps Northwestern students find and track meals at dining halls based on their nutrition goals and dietary preferences.

## Features

- **AI-Powered Recommendations**: Claude (Anthropic) generates personalized meal suggestions based on your fitness goals, macro targets, dietary restrictions, and food preferences
- **Live Menu Data**: Scrapes Northwestern's dining menus daily via DineOnCampus + ZenRows
- **Meal Tracking**: Log meals and track daily macros (calories, protein, carbs, fat) against your targets
- **Dietary Filters**: Vegetarian, vegan, gluten-free, kosher, dairy-free, nut-free
- **All Dining Halls**: Covers Allison, Elder, Sargent, Plex East, and Plex West
- **User Profiles**: Fitness goals, macro targets, and food preferences saved per account
- **Dark Mode**: System-aware dark/light mode toggle

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Auth**: NextAuth 5 (Google OAuth) with JWT sessions
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **AI**: Anthropic SDK (Claude Sonnet)
- **Web Scraping**: ZenRows + Cheerio + Axios
- **State Management**: Zustand (client), TanStack Query (server)
- **Validation**: Zod, React Hook Form

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account
- Anthropic API key
- Google OAuth credentials
- ZenRows API key

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:lukemossbarger/vibe-coding.git
   cd vibe-coding
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in your credentials:
   - `DATABASE_URL` — Supabase PostgreSQL connection string
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
   - `ANTHROPIC_API_KEY` — Claude API key
   - `GOOGLE_CLIENT_ID` — Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
   - `ZENROWS_API_KEY` — ZenRows scraping API key

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
vibe-coding/
├── app/                        # Next.js app directory
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── menu/                   # Main menu explorer page
│   ├── auth/signin/            # Google sign-in page
│   └── api/
│       ├── auth/               # NextAuth handlers
│       ├── meals/              # Meal tracking endpoints
│       ├── profile/            # User profile endpoints
│       ├── food-preferences/   # Food likes/dislikes
│       └── recommend/          # AI recommendation endpoint
├── components/                 # React components
├── lib/
│   ├── db/                     # Drizzle schema, client, types
│   ├── scraper/                # DineOnCampus scraper
│   ├── stores/                 # Zustand stores
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Macro calculator, etc.
│   └── dining-halls/           # Dining hall schedule logic
├── auth.ts                     # NextAuth configuration
├── middleware.ts               # Route protection
└── drizzle.config.ts          # Drizzle config
```

## Database Schema

- **menuItems** — Scraped dining menu catalog (name, hall, date, nutrition, dietary tags)
- **userProfiles** — Fitness goals, macro targets, dietary restrictions per user
- **trackedMeals** — User meal history with denormalized nutrition data
- **foodPreferences** — Per-user food likes/dislikes for recommendation tuning
- NextAuth tables (users, accounts, sessions, verificationTokens)

## Development Scripts

- `npm run dev` — Start development server with Turbopack
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run test` — Run Vitest unit tests
- `npm run test:e2e` — Run Playwright E2E tests
- `npm run db:generate` — Generate database migrations
- `npm run db:migrate` — Run database migrations
- `npm run db:push` — Push schema changes to database
- `npm run db:studio` — Open Drizzle Studio (database GUI)

## Contributing

Capstone project by Luke Mossbarger (Winter Quarter 2026).

## License

ISC
