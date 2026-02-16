# Northwestern Dining Hall Meal Finder - TODO

## ✅ Implemented Features

### Core Infrastructure
- [x] Next.js 16 + React 19 + TypeScript setup
- [x] Tailwind CSS v4 styling
- [x] Supabase PostgreSQL database integration
- [x] Drizzle ORM for database operations
- [x] Environment configuration (.env)
- [x] Git repository initialization

### Data Collection & Storage
- [x] Web scraper using ZenRows (Cloudflare bypass)
- [x] DineOnCampus API integration
- [x] Scrape menu data from 5 main dining halls:
  - Allison Dining Commons
  - Sargent Dining Commons
  - Foster Walker Plex East
  - Foster Walker Plex West
  - Elder Dining Commons
- [x] Database schema for menu items with:
  - Basic info (name, dining hall, meal period, date, station)
  - Nutrition data (calories, protein, carbs, fat, fiber, sugar, sodium)
  - Dietary tags (IMPLEMENTED: vegetarian, vegan, gluten-free, kosher, NOT IMPLEMENTED: dairy-free, nut-free)
  - Serving size, ingredients, allergens
- [x] Database schema for user preferences
- [x] Duplicate detection when saving menu data
- [x] Smart API call conservation (164/1000 requests used)

### User Interface
- [x] Landing page with project description
- [x] Menu Explorer page with:
  - Date and time selection (defaults to current)
  - Dining hall filter
  - Meal period filter
  - "Show only open dining halls" toggle
  - Search by dish name
  - Dietary preference filters (6 options)
  - Real-time dining hall status display
  - Nutrition information display
  - Dietary tag badges
  - Station/area display for each item
- [x] Responsive design (mobile, tablet, desktop)
- [x] Loading states and error handling

### Dining Hall Schedules
- [x] Hardcoded schedule configuration for all halls:
  - Meal times (breakfast, lunch, dinner)
  - Operating hours per hall
  - Plex West special hours (no breakfast)
- [x] Real-time "Open Now" status calculation
- [x] Time-based meal filtering
- [x] Visual indicators for open/closed status

### AI-Powered Recommendations
- [x] Claude Sonnet 4.5 integration (Anthropic API)
- [x] NOT IMPLEMENTED: OpenAI GPT-4 fallback support
- [x] User profile system with:
  - Physical attributes (age, height, weight, gender)
  - Activity level selection
  - Fitness goals (lose weight, maintain, gain muscle, gain weight)
  - Dietary restrictions
  - Target macro calculations (auto-computed via Mifflin-St Jeor)
- [x] LocalStorage persistence for user profiles
- [x] AI meal recommendations with:
  - Specific station/area locations
  - Nutritional reasoning
  - Portion suggestions
  - Meal timing advice
- [x] Profile modal UI
- [x] Recommendations display with markdown formatting

### Developer Tools & Scripts
- [x] Database setup script (`setup-db.ts`)
- [x] Menu scraping script (`scrape-and-save.ts`)
- [x] Database cleanup script (`cleanup-database.ts`)
- [x] Station data verification script (`check-stations.ts`)
- [x] SQL migration scripts
- [x] Development server with hot reload

## 🚧 Partially Implemented

### User Preferences
- [x] User profile creation and editing
- [ ] Save preferences to database (currently localStorage only)
- [ ] User authentication/login system
- [ ] Multi-user support

### Data Management
- [x] Manual scraping on-demand
- [ ] Automated daily scraping (cron job)
- [ ] Historical menu data tracking
- [ ] Menu change notifications

## 📋 Not Yet Implemented

### Meal Planning & Tracking
- [ ] Daily meal logging
- [ ] Nutrition tracking over time
- [ ] Progress towards macro/calorie goals
- [ ] Weekly meal planning
- [ ] Meal history view
- [ ] Export meals to calendar

### Advanced Filtering & Search
- [ ] Filter by specific macro ranges (e.g., high protein)
- [ ] Sort by nutritional values
- [ ] Favorite/saved items
- [ ] Recently viewed items
- [ ] "Similar items" suggestions
- [ ] Allergen warnings/alerts

### Social & Sharing
- [ ] Share meal recommendations
- [ ] Rate/review menu items
- [ ] User comments on dishes
- [ ] Popular items display
- [ ] Friend meal suggestions

### Notifications & Alerts
- [ ] Push notifications for favorite items
- [ ] Email digest of daily menus
- [ ] Alerts when dining halls open/close
- [ ] Weekly meal prep suggestions

### Analytics & Insights
- [ ] Personal nutrition analytics dashboard
- [ ] Weekly/monthly nutrition summaries
- [ ] Goal achievement tracking
- [ ] Macro distribution charts
- [ ] Most eaten items
- [ ] Dining hall visit frequency

### Mobile Experience
- [ ] Progressive Web App (PWA)
- [ ] Mobile app (React Native)
- [ ] Offline support
- [ ] Location-based suggestions
- [ ] QR code meal logging

### Admin & Management
- [ ] Admin dashboard
- [ ] Manual menu entry/editing
- [ ] Scraper monitoring dashboard
- [ ] API usage analytics
- [ ] User management interface

### Integration Features
- [ ] MyFitnessPal integration
- [ ] Apple Health integration
- [ ] Google Fit integration
- [ ] Calendar integration
- [ ] Northwestern authentication (SSO)

### Performance & Optimization
- [ ] Image optimization for food items
- [ ] Server-side caching
- [ ] Redis for session management
- [ ] CDN for static assets
- [ ] Database query optimization
- [ ] Pagination for large result sets

## 🐛 Known Issues & Improvements Needed

### Current Issues
- [ ] Hydration warning when profile loads from localStorage (non-critical)
- [ ] Date/time picker defaults could be smarter
- [ ] No error handling for API rate limits
- [ ] Menu items without nutrition data show empty boxes

### Future Improvements
- [ ] Better error messages for users
- [ ] Loading skeletons instead of blank screens
- [ ] Keyboard shortcuts for power users
- [ ] Dark mode support
- [ ] Accessibility improvements (ARIA labels, screen reader support)
- [ ] Internationalization (i18n) support
- [ ] Print-friendly meal plans
- [ ] Bulk operations (select multiple items)

## 📊 Technical Debt

- [ ] Add comprehensive test suite (Jest, React Testing Library)
- [ ] E2E tests (Playwright)
- [ ] API route validation (Zod schemas)
- [ ] Database migrations system (instead of manual SQL)
- [ ] Error monitoring (Sentry)
- [ ] Analytics (PostHog, Plausible)
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Staging environment
- [ ] Documentation (API docs, architecture diagrams)

## 🎯 Priority Next Steps

1. **Save user preferences to database** - Move from localStorage to persistent storage
2. **Automated daily scraping** - Set up cron job to refresh menu daily
3. **Meal logging** - Track what users eat throughout the day
4. **Nutrition dashboard** - Show progress towards goals
5. **PWA setup** - Enable offline access and mobile install

---

## ZenRows API Usage: 164/1000 requests (836 remaining)

**Note:** Always request permission before using additional ZenRows requests.
