"use client";

import { MacroProgress } from '@/lib/types/meal-tracking';

interface MacroDashboardProps {
  progress: MacroProgress | null;
}

export function MacroDashboard({ progress }: MacroDashboardProps) {
  if (!progress) {
    return (
      <div className="bg-purple-100 dark:bg-gray-800 rounded-2xl p-6 mb-6">
        <p className="text-center text-gray-700 dark:text-gray-300">
          📊 Set up your profile to track macro progress!
        </p>
      </div>
    );
  }

  const getProgressColor = (consumed: number, target: number) => {
    const percentage = (consumed / target) * 100;
    if (percentage >= 100) return 'text-red-600 bg-red-100';
    if (percentage >= 85) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getBarColor = (consumed: number, target: number) => {
    const percentage = (consumed / target) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 85) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const MacroItem = ({
    label,
    consumed,
    target,
    remaining,
    emoji
  }: {
    label: string;
    consumed: number;
    target: number;
    remaining: number;
    emoji: string;
  }) => {
    const percentage = Math.min((consumed / target) * 100, 100);
    const colorClass = getProgressColor(consumed, target);
    const barColorClass = getBarColor(consumed, target);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-gray-800 dark:text-white">
            {emoji} {label}
          </h4>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colorClass}`}>
            {consumed}/{target}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-2">
          <div
            className={`${barColorClass} h-3 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {remaining >= 0 ? (
              <>Remaining: <span className="font-semibold text-gray-800 dark:text-gray-200">{remaining}</span></>
            ) : (
              <>Over by: <span className="font-semibold text-red-600">{Math.abs(remaining)}</span></>
            )}
          </span>
          <span className="text-gray-500 dark:text-gray-400">{Math.round(percentage)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-purple-50 dark:bg-gray-900 rounded-2xl p-6 mb-6">
      <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-4">📊 Today's Macro Progress</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MacroItem
          label="Calories"
          consumed={progress.calories.consumed}
          target={progress.calories.target}
          remaining={progress.calories.remaining}
          emoji="🔥"
        />
        <MacroItem
          label="Protein"
          consumed={progress.protein.consumed}
          target={progress.protein.target}
          remaining={progress.protein.remaining}
          emoji="💪"
        />
        <MacroItem
          label="Carbs"
          consumed={progress.carbs.consumed}
          target={progress.carbs.target}
          remaining={progress.carbs.remaining}
          emoji="🍞"
        />
        <MacroItem
          label="Fat"
          consumed={progress.fat.consumed}
          target={progress.fat.target}
          remaining={progress.fat.remaining}
          emoji="🥑"
        />
        <MacroItem
          label="Sugar"
          consumed={progress.sugar.consumed}
          target={progress.sugar.target}
          remaining={progress.sugar.remaining}
          emoji="🍬"
        />
      </div>
    </div>
  );
}
