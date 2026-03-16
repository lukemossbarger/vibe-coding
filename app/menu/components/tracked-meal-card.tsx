"use client";

import { useState } from 'react';
import { TrackedMeal } from '@/lib/types/meal-tracking';
import { useMealStore } from '@/lib/stores/meal-store';

interface TrackedMealCardProps {
  meal: TrackedMeal;
}

export function TrackedMealCard({ meal }: TrackedMealCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const removeMeal = useMealStore((state) => state.removeMeal);

  const handleRemove = async () => {
    if (!confirm(`Remove ${meal.menuItem.name} from today's meals?`)) return;

    setIsRemoving(true);
    try {
      await removeMeal(meal.id);
    } catch (error) {
      console.error('Failed to remove meal:', error);
      setIsRemoving(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-[#C9A530] transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-gray-800 dark:text-white">{meal.menuItem.name}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {meal.menuItem.diningHall} • {formatTime(meal.timestamp)}
            {meal.source === 'recommendation' && ' • ✨ AI Pick'}
          </p>
        </div>
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 transition-all disabled:opacity-50"
          title="Remove meal"
        >
          {isRemoving ? '...' : '✕'}
        </button>
      </div>

      {/* Nutrition summary */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Cals:</span>{' '}
          <span className="font-semibold text-purple-700 dark:text-[#C9A530]">{meal.menuItem.calories || 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-600">P:</span>{' '}
          <span className="font-semibold text-blue-700">{meal.menuItem.protein || 'N/A'}g</span>
        </div>
        <div>
          <span className="text-gray-600">C:</span>{' '}
          <span className="font-semibold text-orange-700">{meal.menuItem.carbs || 'N/A'}g</span>
        </div>
        <div>
          <span className="text-gray-600">F:</span>{' '}
          <span className="font-semibold text-yellow-700">{meal.menuItem.fat || 'N/A'}g</span>
        </div>
        <div>
          <span className="text-gray-600">S:</span>{' '}
          <span className="font-semibold text-pink-700">{meal.menuItem.sugar || 'N/A'}g</span>
        </div>
      </div>

      {/* Dietary tags */}
      {(meal.menuItem.isVegetarian || meal.menuItem.isVegan || meal.menuItem.isGlutenFree) && (
        <div className="flex gap-1 mt-2">
          {meal.menuItem.isVegetarian && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🌱</span>
          )}
          {meal.menuItem.isVegan && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🌿</span>
          )}
          {meal.menuItem.isGlutenFree && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">GF</span>
          )}
        </div>
      )}
    </div>
  );
}
