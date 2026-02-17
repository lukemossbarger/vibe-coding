import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TrackedMeal, NutritionTotals, MenuItem } from '@/lib/types/meal-tracking';

interface MealStore {
  meals: TrackedMeal[];
  isLoading: boolean;
  isSyncing: boolean;

  // Actions
  fetchMealsForDate: (date: string) => Promise<void>;
  addMeal: (menuItem: MenuItem, source?: 'recommendation' | 'manual') => Promise<void>;
  removeMeal: (mealId: string) => Promise<void>;
  getMealsForDate: (date: string) => TrackedMeal[];
  getTotalsForDate: (date: string) => NutritionTotals;
}

export const useMealStore = create<MealStore>()(
  persist(
    (set, get) => ({
      meals: [],
      isLoading: false,
      isSyncing: false,

      fetchMealsForDate: async (date: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`/api/meals?date=${date}`);
          if (!response.ok) throw new Error('Failed to fetch meals');

          const data = await response.json();
          set({ meals: data.meals, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch meals:', error);
          set({ isLoading: false });
        }
      },

      addMeal: async (menuItem, source = 'manual') => {
        set({ isSyncing: true });

        // Optimistic update
        const now = new Date();
        const tempId = crypto.randomUUID();
        const tempMeal: TrackedMeal = {
          id: tempId,
          userId: '', // Will be set by backend
          menuItem,
          timestamp: now.getTime(),
          date: now.toISOString().split('T')[0],
          source,
        };

        set((state) => ({ meals: [...state.meals, tempMeal] }));

        try {
          // Sync with backend
          const response = await fetch('/api/meals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              menuItem,
              source,
              timestamp: tempMeal.timestamp,
              date: tempMeal.date,
            }),
          });

          if (!response.ok) throw new Error('Failed to add meal');

          const data = await response.json();

          // Replace temp meal with server response
          set((state) => ({
            meals: state.meals.map((m) => (m.id === tempId ? data.meal : m)),
            isSyncing: false,
          }));
        } catch (error) {
          console.error('Failed to add meal:', error);
          // Rollback optimistic update
          set((state) => ({
            meals: state.meals.filter((m) => m.id !== tempId),
            isSyncing: false,
          }));
        }
      },

      removeMeal: async (mealId) => {
        set({ isSyncing: true });

        // Optimistic update
        const previousMeals = get().meals;
        set((state) => ({
          meals: state.meals.filter((m) => m.id !== mealId),
        }));

        try {
          const response = await fetch(`/api/meals/${mealId}`, {
            method: 'DELETE',
          });

          if (!response.ok) throw new Error('Failed to remove meal');

          set({ isSyncing: false });
        } catch (error) {
          console.error('Failed to remove meal:', error);
          // Rollback
          set({ meals: previousMeals, isSyncing: false });
        }
      },

      getMealsForDate: (date) => {
        return get().meals.filter((m) => m.date === date);
      },

      getTotalsForDate: (date) => {
        const mealsForDate = get().getMealsForDate(date);
        return mealsForDate.reduce(
          (totals, meal) => ({
            calories: totals.calories + (meal.menuItem.calories || 0),
            protein: totals.protein + (meal.menuItem.protein || 0),
            carbs: totals.carbs + (meal.menuItem.carbs || 0),
            fat: totals.fat + (meal.menuItem.fat || 0),
            sugar: totals.sugar + (meal.menuItem.sugar || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 }
        );
      },
    }),
    {
      name: 'meal-tracking-storage', // localStorage key (for offline cache)
    }
  )
);
