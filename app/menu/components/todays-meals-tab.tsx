"use client";

import { useEffect } from 'react';
import { UserProfile } from '@/lib/types/user-profile';
import { useMealStore } from '@/lib/stores/meal-store';
import { calculateMacroProgress } from '@/lib/utils/macro-calculator';
import { MacroDashboard } from './macro-dashboard';
import { TrackedMealCard } from './tracked-meal-card';

interface TodaysMealsTabProps {
  userProfile: UserProfile;
}

export function TodaysMealsTab({ userProfile }: TodaysMealsTabProps) {
  const meals = useMealStore((state) => state.meals);
  const isLoading = useMealStore((state) => state.isLoading);
  const fetchMealsForDate = useMealStore((state) => state.fetchMealsForDate);
  const getMealsForDate = useMealStore((state) => state.getMealsForDate);
  const getTotalsForDate = useMealStore((state) => state.getTotalsForDate);

  const today = new Date().toISOString().split('T')[0];

  // Fetch meals for today on mount
  useEffect(() => {
    fetchMealsForDate(today);
  }, [fetchMealsForDate, today]);

  const todaysMeals = getMealsForDate(today);
  const totals = getTotalsForDate(today);
  const progress = calculateMacroProgress(userProfile, totals);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Macro Dashboard */}
      <MacroDashboard progress={progress} />

      {/* Meals List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-gray-800">🍽️ Today's Meals</h3>
          <span className="text-sm text-gray-600">
            {todaysMeals.length} {todaysMeals.length === 1 ? 'meal' : 'meals'} tracked
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading your meals...</p>
          </div>
        ) : todaysMeals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-6xl mb-4">🍽️</p>
            <p className="text-xl font-semibold text-gray-700 mb-2">No meals tracked yet today</p>
            <p className="text-gray-500">
              Add meals from the AI Recommendations tab or manually from the Explore Menu
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaysMeals.map((meal) => (
              <TrackedMealCard key={meal.id} meal={meal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
