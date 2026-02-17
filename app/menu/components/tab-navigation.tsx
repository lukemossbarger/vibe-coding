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
    <div className="flex gap-2 border-b-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-2.5 rounded-t-2xl font-bold transition-all ${
            activeTab === tab.id
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-purple-100'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
