"use client";

interface TabNavigationProps {
  activeTab: 'explore' | 'recommendations' | 'today';
  onTabChange: (tab: 'explore' | 'recommendations' | 'today') => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'explore', label: '🍽️ Explore Menu' },
    { id: 'recommendations', label: '✨ AI Recommendations' },
    { id: 'today', label: '📊 Today\'s Meals' },
  ] as const;

  return (
    <div className="flex gap-2 border-b-2 border-purple-200 dark:border-gray-700 bg-purple-50 dark:bg-gray-900 px-6 py-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-2.5 rounded-t-2xl font-bold transition-all ${
            activeTab === tab.id
              ? 'bg-purple-600 dark:bg-gradient-to-r dark:from-[#C9A530] dark:via-[#EDD96A] dark:to-[#B8943A] dark:hover:from-[#A88928] dark:hover:via-[#D4BC50] dark:hover:to-[#9A7820] text-white dark:text-gray-900 shadow-lg'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
