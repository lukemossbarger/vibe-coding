# Future Meal Tracking Features

This document outlines the infrastructure and design considerations for future meal tracking enhancements. These features are NOT part of the current implementation but are planned for future development.

---

## 1. 7-Day Meal History Tracking

### Purpose
Avoid recommending the same meals repeatedly and provide the AI with context about recent eating patterns.

### Data Structure Extensions

```typescript
interface MealStore {
  // ... existing state

  // NEW: Historical meal query methods
  getMealsForDateRange: (startDate: string, endDate: string) => TrackedMeal[];
  getRecentMeals: (days: number) => TrackedMeal[]; // Default 7 days
  getMealFrequency: (days: number) => Map<string, number>; // menuItemName -> count

  // NEW: Cleanup for old data
  deleteOldMeals: (olderThanDays: number) => void;
}
```

### Storage Considerations

**localStorage Limits:**
- 5-10MB typical browser limit
- ~7 days × 3 meals/day × 2KB/meal = ~42KB (well within limits)
- At 30 days: ~180KB (still safe)

**Automatic Cleanup Strategy:**
```typescript
// Run on app mount
const cleanupOldMeals = () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days max
  const cutoffString = cutoffDate.toISOString().split('T')[0];

  store.setState((state) => ({
    meals: state.meals.filter((m) => m.date >= cutoffString)
  }));
};
```

### AI Prompt Enhancement

```typescript
const recentMealsContext = `
Recent meals (last 7 days):
${recentMeals.map(m => `- ${m.menuItem.name} (${m.date})`).join('\n')}

Meal frequency:
${Array.from(mealFrequency.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([name, count]) => `- ${name}: ${count}x`)
  .join('\n')}

IMPORTANT: Avoid recommending items the user ate in the last 2 days unless they specifically request it. Prioritize variety.
`;
```

### UI Components

**New Component: `/app/menu/components/meal-history-view.tsx`**
- Calendar view showing meals by date
- Click date → expand to see all meals
- Hover → tooltip with nutrition totals
- Filter by dining hall, meal type, dietary tags

---

## 2. User Rating System & Taste Profile

### Purpose
Build a personalized taste profile to improve AI recommendations over time.

### Data Structure

```typescript
interface TrackedMeal {
  // ... existing fields

  // NEW: Rating and feedback
  rating?: number; // 1-5 stars, undefined if not rated
  feedback?: string; // Optional text feedback
  ratedAt?: number; // Timestamp when rated
}

interface TasteProfile {
  userId?: string; // Future: for backend storage

  // Aggregated preferences
  favoriteItems: Map<string, AggregatedRating>; // menuItemId -> stats
  favoriteTags: Map<string, number>; // dietary tag -> avg rating
  preferredStations: Map<string, number>; // station -> avg rating
  preferredMealPeriods: Map<string, number>; // breakfast/lunch/dinner -> avg rating

  // Ingredient-level learning (advanced)
  likedIngredients: string[]; // Parsed from highly-rated meals
  dislikedIngredients: string[]; // Parsed from low-rated meals

  // Macro preferences
  preferredProteinRatio: number; // Learn if user prefers high/low protein
  preferredCarbRatio: number;

  // Metadata
  totalRatings: number;
  lastUpdated: number; // Timestamp
}

interface AggregatedRating {
  menuItemId: string;
  menuItemName: string;
  avgRating: number;
  count: number; // How many times rated
  lastRated: number; // Timestamp
}
```

### Rating UI Flow

1. **In-App Rating Prompt:**
   - After adding meal to "Today's Meals", show subtle prompt: "Rate this meal?"
   - Star rating (1-5) with quick feedback buttons: "Too salty", "Perfect", "Bland", etc.
   - Optional text feedback field

2. **Post-Meal Rating:**
   - In "Today's Meals" tab, show rating option next to each meal
   - Use emoji feedback: ⭐⭐⭐⭐⭐ (interactive)
   - Once rated, show checkmark and timestamp

3. **Rating History:**
   - New tab: "My Ratings" showing all rated meals
   - Sort by: rating (high/low), date, dining hall
   - Edit/delete ratings

### Taste Profile Algorithm

```typescript
/**
 * Updates taste profile based on new rating
 */
function updateTasteProfile(
  profile: TasteProfile,
  meal: TrackedMeal,
  rating: number
): TasteProfile {
  const { menuItem } = meal;

  // Update favorite items
  const existing = profile.favoriteItems.get(menuItem.id) || {
    menuItemId: menuItem.id,
    menuItemName: menuItem.name,
    avgRating: 0,
    count: 0,
    lastRated: 0,
  };

  const newCount = existing.count + 1;
  const newAvg = (existing.avgRating * existing.count + rating) / newCount;

  profile.favoriteItems.set(menuItem.id, {
    ...existing,
    avgRating: newAvg,
    count: newCount,
    lastRated: Date.now(),
  });

  // Update dietary tag preferences
  const tags = [
    menuItem.isVegetarian && 'vegetarian',
    menuItem.isVegan && 'vegan',
    menuItem.isGlutenFree && 'gluten-free',
    // ... other tags
  ].filter(Boolean);

  tags.forEach((tag) => {
    const existingRating = profile.favoriteTags.get(tag!) || 0;
    const updatedRating = (existingRating + rating) / 2; // Simple average
    profile.favoriteTags.set(tag!, updatedRating);
  });

  // Update station preferences
  if (menuItem.station) {
    const existingRating = profile.preferredStations.get(menuItem.station) || 0;
    profile.preferredStations.set(
      menuItem.station,
      (existingRating + rating) / 2
    );
  }

  // Learn macro preferences (if they consistently rate high-protein meals highly)
  if (menuItem.protein && menuItem.calories) {
    const proteinRatio = (menuItem.protein * 4) / menuItem.calories; // Protein calories / total
    if (rating >= 4) {
      profile.preferredProteinRatio =
        (profile.preferredProteinRatio + proteinRatio) / 2;
    }
  }

  profile.totalRatings++;
  profile.lastUpdated = Date.now();

  return profile;
}
```

### AI Integration with Taste Profile

```typescript
const tasteProfileContext = `
User's Taste Profile (based on ${profile.totalRatings} ratings):

Top Rated Meals:
${Array.from(profile.favoriteItems.values())
  .filter((item) => item.avgRating >= 4)
  .sort((a, b) => b.avgRating - a.avgRating)
  .slice(0, 10)
  .map((item) => `- ${item.menuItemName} (${item.avgRating.toFixed(1)}⭐, tried ${item.count}x)`)
  .join('\n')}

Low Rated Meals (avoid recommending):
${Array.from(profile.favoriteItems.values())
  .filter((item) => item.avgRating <= 2)
  .map((item) => `- ${item.menuItemName} (${item.avgRating.toFixed(1)}⭐)`)
  .join('\n')}

Preferred Dietary Tags:
${Array.from(profile.favoriteTags.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([tag, rating]) => `- ${tag}: ${rating.toFixed(1)}⭐`)
  .join('\n')}

Preferred Stations:
${Array.from(profile.preferredStations.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([station, rating]) => `- ${station}: ${rating.toFixed(1)}⭐`)
  .join('\n')}

INSTRUCTIONS:
- Prioritize items similar to highly-rated meals
- NEVER recommend items rated 2⭐ or below
- Favor dietary tags and stations the user prefers
- Consider the user enjoys ${profile.preferredProteinRatio > 0.3 ? 'high-protein' : 'balanced'} meals
`;
```

---

## 3. Backend Migration Strategy

### When to Migrate

**Triggers for backend need:**
1. User wants cross-device sync
2. localStorage approaching limits (>3MB)
3. Need for analytics dashboard
4. Social features (share meals, see friends' ratings)

### Database Schema (PostgreSQL with Drizzle ORM)

```typescript
// /lib/db/schema.ts extensions

export const trackedMeals = pgTable('tracked_meals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id).notNull(),

  timestamp: timestamp('timestamp').defaultNow().notNull(),
  date: date('date').notNull(), // YYYY-MM-DD for indexing

  source: varchar('source', { length: 20 }).notNull(), // 'recommendation' | 'manual'

  // Rating fields
  rating: integer('rating'), // 1-5, nullable
  feedback: text('feedback'),
  ratedAt: timestamp('rated_at'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasteProfiles = pgTable('taste_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),

  // Serialized JSON for complex data
  favoriteItems: jsonb('favorite_items').notNull().default('{}'),
  favoriteTags: jsonb('favorite_tags').notNull().default('{}'),
  preferredStations: jsonb('preferred_stations').notNull().default('{}'),
  preferredMealPeriods: jsonb('preferred_meal_periods').notNull().default('{}'),

  // Simple fields
  preferredProteinRatio: real('preferred_protein_ratio').default(0.25),
  preferredCarbRatio: real('preferred_carb_ratio').default(0.45),

  totalRatings: integer('total_ratings').notNull().default(0),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Indexes for performance
export const trackedMealsDateIdx = index('tracked_meals_date_idx').on(trackedMeals.date);
export const trackedMealsUserDateIdx = index('tracked_meals_user_date_idx').on(
  trackedMeals.userId,
  trackedMeals.date
);
```

### API Endpoints Needed

```typescript
// /app/api/meals/route.ts
POST   /api/meals              // Add meal to tracker
GET    /api/meals?date=...     // Get meals for date
DELETE /api/meals/:id          // Remove meal

// /app/api/meals/[id]/rate/route.ts
POST   /api/meals/:id/rate     // Rate a meal

// /app/api/taste-profile/route.ts
GET    /api/taste-profile      // Get user's taste profile
POST   /api/taste-profile      // Update taste profile (admin)

// /app/api/meals/history/route.ts
GET    /api/meals/history?days=7  // Get recent meals
```

### Migration from localStorage to Backend

```typescript
/**
 * One-time migration utility
 * Runs on first login after backend is deployed
 */
async function migrateLocalStorageToBackend(userId: string) {
  // Read from localStorage
  const localData = localStorage.getItem('meal-tracking-storage');
  if (!localData) return;

  const { meals } = JSON.parse(localData);

  // Batch upload to backend
  const response = await fetch('/api/meals/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meals, userId }),
  });

  if (response.ok) {
    // Archive local data (don't delete immediately)
    localStorage.setItem('meal-tracking-storage-backup', localData);
    localStorage.removeItem('meal-tracking-storage');
    console.log('Successfully migrated meal data to backend');
  }
}
```

### Offline Support Strategy

**Optimistic Updates with Sync Queue:**
```typescript
interface SyncQueue {
  pendingAdds: TrackedMeal[];
  pendingDeletes: string[]; // Meal IDs
  pendingRatings: Array<{ mealId: string; rating: number; feedback?: string }>;
}

// Store locally and sync when online
const addMealOffline = (meal: TrackedMeal) => {
  // Add to local state immediately
  useMealStore.getState().addMeal(meal.menuItem);

  // Add to sync queue
  const queue = getSyncQueue();
  queue.pendingAdds.push(meal);
  saveSyncQueue(queue);

  // Attempt sync if online
  if (navigator.onLine) {
    syncPendingActions();
  }
};
```

---

## 4. Advanced Analytics Features

### Weekly/Monthly Trend Reports

**Metrics to Track:**
- Average daily calories vs. target (over/under %)
- Macro distribution trends (protein/carbs/fat ratios)
- Most frequent meals
- Dining hall frequency
- Meal timing patterns (breakfast at 8am, lunch at 12pm, etc.)
- Rating trends (are they enjoying meals more/less over time?)

**UI Component: `/app/analytics/page.tsx`**
- Line charts (calories over time)
- Pie charts (macro distribution)
- Bar charts (dining hall frequency)
- Heatmap (meal times)

### Export Functionality

```typescript
/**
 * Export meal logs as CSV
 */
function exportMealsAsCSV(meals: TrackedMeal[]): string {
  const headers = [
    'Date',
    'Time',
    'Meal Name',
    'Dining Hall',
    'Meal Period',
    'Calories',
    'Protein (g)',
    'Carbs (g)',
    'Fat (g)',
    'Rating',
  ];

  const rows = meals.map((m) => [
    m.date,
    new Date(m.timestamp).toLocaleTimeString(),
    m.menuItem.name,
    m.menuItem.diningHall,
    m.menuItem.mealPeriod,
    m.menuItem.calories || '',
    m.menuItem.protein || '',
    m.menuItem.carbs || '',
    m.menuItem.fat || '',
    m.rating || '',
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

/**
 * Trigger download
 */
function downloadMealExport(meals: TrackedMeal[]) {
  const csv = exportMealsAsCSV(meals);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meal-log-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## 5. Meal Repetition Avoidance Algorithm

### Smart Recommendation Logic

```typescript
/**
 * Filters out recently eaten meals and adjusts scoring
 */
function applyRepetitionPenalty(
  recommendations: MealRecommendation[],
  recentMeals: TrackedMeal[]
): MealRecommendation[] {
  const recentItemIds = new Set(
    recentMeals
      .filter((m) => {
        const daysAgo = (Date.now() - m.timestamp) / (1000 * 60 * 60 * 24);
        return daysAgo <= 2; // Last 2 days
      })
      .map((m) => m.menuItem.id)
  );

  // Filter out items eaten in last 2 days
  const filtered = recommendations.filter(
    (rec) => !recentItemIds.has(rec.menuItemId)
  );

  // If we filtered everything, relax to 1 day
  if (filtered.length === 0) {
    const oneDayAgo = Date.now() - 1000 * 60 * 60 * 24;
    const oneDay = new Set(
      recentMeals
        .filter((m) => m.timestamp > oneDayAgo)
        .map((m) => m.menuItem.id)
    );
    return recommendations.filter((rec) => !oneDay.has(rec.menuItemId));
  }

  return filtered;
}
```

### Station Variety

```typescript
/**
 * Ensure recommendations come from diverse stations
 */
function enforceStationVariety(
  recommendations: MealRecommendation[],
  availableItems: MenuItem[]
): MealRecommendation[] {
  const stationCounts = new Map<string, number>();

  return recommendations.filter((rec) => {
    const item = availableItems.find((i) => i.id === rec.menuItemId);
    if (!item?.station) return true;

    const count = stationCounts.get(item.station) || 0;
    if (count >= 2) return false; // Max 2 items per station

    stationCounts.set(item.station, count + 1);
    return true;
  });
}
```

---

## 6. Machine Learning Enhancements (Future)

### Collaborative Filtering

**Concept:** "Users who liked X also liked Y"

**Implementation:**
1. Collect rating data from all users (anonymized)
2. Use cosine similarity to find users with similar taste profiles
3. Recommend meals that similar users rated highly

**Privacy:** All data anonymized, no PII shared

### Ingredient-Level Analysis

**NLP Parsing of Ingredients:**
```typescript
/**
 * Extract ingredients from menu item descriptions
 * Use OpenAI/Claude to parse and categorize
 */
async function analyzeIngredients(menuItem: MenuItem): Promise<string[]> {
  const prompt = `
  Extract all ingredients from this meal description:
  Name: ${menuItem.name}
  Ingredients: ${menuItem.ingredients}

  Return a JSON array of ingredient names, normalized (e.g., "chicken breast" not "grilled chicken").
  `;

  const response = await callAI(prompt);
  return JSON.parse(response); // ["chicken breast", "brown rice", "broccoli", ...]
}
```

**Preference Learning:**
- If user rates "Grilled Chicken" highly multiple times → learns user likes chicken
- If user rates "Tofu Stir Fry" poorly → learns user dislikes tofu
- Apply to future recommendations: boost chicken dishes, avoid tofu

---

## 7. Implementation Priority (When to Build Each Feature)

### Phase 1 (Current): Core Meal Tracking
- ✅ Track today's meals
- ✅ Calculate remaining macros
- ✅ Basic AI recommendations

### Phase 2 (Next 2-4 weeks): History & Ratings
- 7-day meal history
- Star rating system (1-5)
- Basic taste profile (favorite items)

### Phase 3 (1-2 months): Analytics & Repetition Avoidance
- Weekly trend reports
- CSV export
- Meal repetition avoidance in AI prompt
- Station variety enforcement

### Phase 4 (3-6 months): Backend Migration & Advanced Features
- User authentication
- Backend API with PostgreSQL
- Cross-device sync
- Offline support with sync queue

### Phase 5 (6+ months): ML & Social
- Collaborative filtering recommendations
- Ingredient-level preference learning
- Social features (share meals, see friends' top picks)
- Mobile app (React Native)

---

## 8. Technical Debt & Considerations

### Performance Monitoring
- Track localStorage size (warn at 4MB, migrate at 5MB)
- Monitor AI response times (optimize prompt if >3s)
- Profile React re-renders (use React DevTools Profiler)

### Testing Strategy
- Unit tests for taste profile algorithm
- Integration tests for localStorage persistence
- E2E tests for meal tracking flow (Playwright)
- Mock AI responses for consistent testing

### Security & Privacy
- Never store PII in localStorage (use backend for sensitive data)
- Anonymize taste profiles before ML analysis
- GDPR compliance: allow data export and deletion
- Rate limiting on AI API to prevent abuse

### Accessibility
- Keyboard navigation for rating stars
- Screen reader support for macro progress
- High contrast mode for color-blind users
- Focus indicators on all interactive elements

---

## Summary

This document outlines a comprehensive roadmap for meal tracking features beyond the MVP. The architecture is designed to scale from localStorage to a full backend system while maintaining data integrity and user privacy. Each phase builds incrementally on the previous, allowing for continuous delivery of value without major refactors.

**Key Takeaways:**
1. Start simple (localStorage + Zustand) but design for scale (backend-ready data structures)
2. Ratings and taste profiles are the foundation for personalized AI recommendations
3. 7-day history prevents repetition and improves variety
4. Backend migration should be seamless with proper data structures
5. ML enhancements come last, after sufficient data collection

**Next Steps After MVP:**
1. Ship Phase 1 (current implementation)
2. Gather user feedback on meal tracking UX
3. Implement ratings (Phase 2) to start collecting preference data
4. Monitor localStorage usage and plan backend migration timeline
