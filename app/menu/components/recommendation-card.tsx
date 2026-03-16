"use client";

import { useState } from 'react';
import { MenuItem } from '@/lib/types/meal-tracking';
import { useMealStore } from '@/lib/stores/meal-store';

interface RecommendationCardProps {
  menuItem: MenuItem;
  reasoning: string;
}

export function RecommendationCard({ menuItem, reasoning }: RecommendationCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const addMeal = useMealStore((state) => state.addMeal);

  const handleAddToday = async () => {
    setIsAdding(true);
    try {
      await addMeal(menuItem, 'recommendation');
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to add meal:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border-2 border-purple-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-[#C9A530] transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{menuItem.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {menuItem.diningHall} • {menuItem.station || 'General'}
          </p>
        </div>
        <div className="flex gap-1">
          {menuItem.isVegetarian && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">🌱 Veg</span>}
          {menuItem.isVegan && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">🌿 Vegan</span>}
          {menuItem.isGlutenFree && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">GF</span>}
        </div>
      </div>

      {/* Nutrition info */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-purple-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-600">Calories</p>
          <p className="text-lg font-bold text-purple-700">{menuItem.calories || 'N/A'}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-600">Protein</p>
          <p className="text-lg font-bold text-blue-700">{menuItem.protein || 'N/A'}g</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-600">Carbs</p>
          <p className="text-lg font-bold text-orange-700">{menuItem.carbs || 'N/A'}g</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-600">Fat</p>
          <p className="text-lg font-bold text-yellow-700">{menuItem.fat || 'N/A'}g</p>
        </div>
      </div>

      {/* AI Reasoning */}
      <div className="bg-purple-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <p className="text-sm font-semibold text-purple-800 dark:bg-gradient-to-r dark:from-[#C9A530] dark:via-[#EDD96A] dark:to-[#B8943A] dark:bg-clip-text dark:text-transparent mb-2">✨ Why this meal?</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{reasoning}</p>
      </div>

      {/* Add to Today button */}
      <button
        onClick={handleAddToday}
        disabled={isAdding || isAdded}
        className={`w-full py-3 rounded-xl font-bold transition-all ${
          isAdded
            ? 'bg-green-500 text-white'
            : isAdding
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-purple-600 dark:bg-gradient-to-r dark:from-[#C9A530] dark:via-[#EDD96A] dark:to-[#B8943A] text-white dark:text-gray-900 hover:shadow-lg hover:scale-105 dark:hover:from-[#A88928] dark:hover:via-[#D4BC50] dark:hover:to-[#9A7820]'
        }`}
      >
        {isAdded ? '✓ Added to Today' : isAdding ? 'Adding...' : '+ Add to Today'}
      </button>
    </div>
  );
}
