# Northwestern Dining Hall Meal Finder

A web application that helps Northwestern students find the perfect meal at dining halls based on their nutrition goals and dietary preferences.

## Features

- 🍽️ **Smart Meal Recommendations**: Input your nutrition goals and get personalized meal suggestions
- 📊 **Nutrition Tracking**: Track calories, protein, carbs, and other macros
- 🌱 **Dietary Filters**: Filter by vegetarian, vegan, gluten-free, kosher, and more
- 🏫 **All Dining Halls**: Covers Allison, Elder, Sargent, Plex East, and Plex West
- 🤖 **AI-Powered**: Uses LLM to understand your preferences and suggest optimal meals

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **Web Scraping**: Cheerio + Axios
- **LLM**: OpenAI API (GPT-4)
- **State Management**: TanStack Query, Zustand
- **Forms**: React Hook Form + Zod

See [stacks.md](./stacks.md) for full tech stack details.

## Getting Started

### Prerequisites

- Node.js 18+ (currently using v25.6.1)
- npm or yarn
- A Supabase account
- An OpenAI API key

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

   Then fill in your credentials:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `OPENAI_API_KEY`: Your OpenAI API key

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
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/
│   ├── db/                # Database layer
│   │   ├── schema.ts      # Drizzle schema definitions
│   │   ├── client.ts      # Database client
│   │   └── types.ts       # TypeScript types
│   └── scraper/           # Web scraping logic
│       ├── dineoncampus.ts    # Main scraper
│       └── save-to-db.ts      # Database utilities
├── scripts/
│   └── test-scraper.ts    # Test scraper functionality
└── stacks.md             # Tech stack documentation
```

## Database Schema

### Menu Items Table
Stores scraped menu items with nutrition and dietary information:
- Basic info: name, dining hall, meal period, date
- Nutrition: calories, protein, carbs, fat, fiber, sugar, sodium
- Dietary tags: vegetarian, vegan, gluten-free, kosher, dairy-free, nut-free
- Additional: serving size, ingredients, allergens

### User Preferences Table
Stores user preferences (local, no auth for now):
- Physical attributes: height, weight, gender
- Nutrition goals: target calories, protein, carbs, fat
- Dietary restrictions: same tags as menu items
- Preferences: preferred dining halls, disliked ingredients

## Web Scraper

The scraper fetches menu data from Northwestern's dineoncampus.com.

### Test the Scraper

```bash
npx tsx scripts/test-scraper.ts
```

**Note**: The scraper selectors are placeholders and need to be updated based on the actual HTML structure of dineoncampus.com. You'll need to:

1. Visit https://northwestern.campusdining.com
2. Inspect the HTML structure using browser DevTools
3. Update the CSS selectors in `lib/scraper/dineoncampus.ts`
4. Test again

If the site uses JavaScript rendering, you may need to switch from Cheerio to Playwright.

## Development Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest unit tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Next Steps

### Week 1: Data Collection ✓
- [x] Set up project structure
- [x] Create database schema
- [x] Build web scraper framework
- [ ] Finalize scraper selectors
- [ ] Test scraping all dining halls

### Week 2: LLM Integration
- [ ] Set up OpenAI API integration
- [ ] Design prompt for meal recommendations
- [ ] Build API endpoint for meal suggestions
- [ ] Test with sample user inputs

### Week 3: Caching & Data
- [ ] Set up automated scraping schedule (Vercel Cron)
- [ ] Implement deduplication logic
- [ ] Optimize database queries
- [ ] Add data validation

### Week 4: UI Development
- [ ] Design landing page
- [ ] Create user input form
- [ ] Build results display
- [ ] Add loading states and error handling

### Week 5: Polish & Features
- [ ] Add dining hall comparison feature
- [ ] Implement MyFitnessPal API integration
- [ ] Improve UI/UX based on testing
- [ ] Deploy to Vercel

## Contributing

This is a capstone project by Luke Mossbarger (Winter Quarter 2026).

## License

ISC
