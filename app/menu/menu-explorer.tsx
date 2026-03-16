"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DINING_HALL_SCHEDULES,
  getCurrentMealPeriod,
  formatMealTime,
  type MealPeriod,
} from "@/lib/dining-halls/schedule";
import { UserProfile } from "@/lib/types/user-profile";
import { useMealStore } from "@/lib/stores/meal-store";
import { UserProfileModal } from "./user-profile-modal";
import { Recommendations } from "./recommendations";
import { TabNavigation } from "./components/tab-navigation";
import { RecommendationsTab } from "./components/recommendations-tab";
import { TodaysMealsTab } from "./components/todays-meals-tab";
import { ThemeToggle } from "@/app/components/theme-toggle";

type MenuItem = {
  id: string;
  name: string;
  diningHall: string;
  mealPeriod: string;
  date: Date;
  station: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isKosher: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  servingSize: string | null;
  ingredients: string | null;
  allergens: string | null;
};

type MenuExplorerProps = {
  items: MenuItem[];
  diningHalls: string[];
};

export function MenuExplorer({ items, diningHalls }: MenuExplorerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedHall, setSelectedHall] = useState<string>("all");
  const [selectedMeal, setSelectedMeal] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyOpen, setShowOnlyOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'explore' | 'recommendations' | 'today'>('explore');
  const [dietaryFilters, setDietaryFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    kosher: false,
    dairyFree: false,
    nutFree: false,
  });

  // Today's consumed totals from meal store
  const today = new Date().toISOString().split("T")[0];
  const getTotalsForDate = useMealStore((state) => state.getTotalsForDate);
  const consumedTotals = getTotalsForDate(today);

  // User profile state with backend persistence
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Food preferences (likes/dislikes)
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);

  // Load profile and preferences from backend after component mounts
  useEffect(() => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setSelectedDate(localDate);
    setSelectedTime(
      `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
    );
    // Default to the current meal period across any open hall, or "all" if none open
    const currentMeal = diningHalls.map((h) => getCurrentMealPeriod(h, now)).find(Boolean);
    if (currentMeal) setSelectedMeal(currentMeal);
    fetchProfile();
    fetchFoodPreferences();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setUserProfile(data.profile);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
    }
  };

  const fetchFoodPreferences = async () => {
    try {
      const response = await fetch('/api/food-preferences');
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes || []);
        setDislikes(data.dislikes || []);
      }
    } catch (error) {
      console.error('Failed to fetch food preferences:', error);
    }
  };

  const handleAddPreference = async (name: string, type: "like" | "dislike") => {
    // Optimistic update
    if (type === "like") {
      setLikes((prev) => [...prev, name]);
      setDislikes((prev) => prev.filter((d) => d !== name));
    } else {
      setDislikes((prev) => [...prev, name]);
      setLikes((prev) => prev.filter((l) => l !== name));
    }

    try {
      await fetch('/api/food-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });
    } catch (error) {
      console.error('Failed to save food preference:', error);
      fetchFoodPreferences(); // Revert on failure
    }
  };

  const handleRemovePreference = async (name: string, type: "like" | "dislike") => {
    // Optimistic update
    if (type === "like") {
      setLikes((prev) => prev.filter((l) => l !== name));
    } else {
      setDislikes((prev) => prev.filter((d) => d !== name));
    }

    try {
      await fetch('/api/food-preferences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });
    } catch (error) {
      console.error('Failed to delete food preference:', error);
      fetchFoodPreferences(); // Revert on failure
    }
  };

  // Save profile to backend when it changes
  const handleSaveProfile = async (profile: UserProfile) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  // Create a Date object from selected date and time
  const selectedDateTime = useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  }, [selectedDate, selectedTime]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter by date — use local date components to match how items are stored (local midnight)
      const d = new Date(item.date);
      const itemDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (itemDateStr !== selectedDate) {
        return false;
      }

      // Filter by dining hall schedule (if showOnlyOpen is enabled)
      if (showOnlyOpen) {
        const currentMealAtHall = getCurrentMealPeriod(item.diningHall, selectedDateTime);

        // If dining hall is closed, don't show any items
        if (!currentMealAtHall) {
          return false;
        }

        // Only show items for the current meal period at this hall
        if (item.mealPeriod !== currentMealAtHall) {
          return false;
        }
      }

      // Filter by dining hall
      if (selectedHall !== "all" && item.diningHall !== selectedHall) {
        return false;
      }

      // Filter by meal period
      if (selectedMeal !== "all" && item.mealPeriod !== selectedMeal) {
        return false;
      }

      // Filter by search term
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filter by dietary restrictions
      if (dietaryFilters.vegetarian && !item.isVegetarian) return false;
      if (dietaryFilters.vegan && !item.isVegan) return false;
      if (dietaryFilters.glutenFree && !item.isGlutenFree) return false;
      if (dietaryFilters.kosher && !item.isKosher) return false;
      if (dietaryFilters.dairyFree && !item.isDairyFree) return false;
      if (dietaryFilters.nutFree && !item.isNutFree) return false;

      return true;
    });
  }, [items, selectedDate, selectedDateTime, selectedHall, selectedMeal, searchTerm, dietaryFilters, showOnlyOpen]);

  // Group items by dining hall
  const itemsByDiningHall = useMemo(() => {
    const grouped = filteredItems.reduce((acc, item) => {
      if (!acc[item.diningHall]) {
        acc[item.diningHall] = [];
      }
      acc[item.diningHall].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
    return grouped;
  }, [filteredItems]);

  const toggleDietaryFilter = (filter: keyof typeof dietaryFilters) => {
    setDietaryFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  const [collapsedHalls, setCollapsedHalls] = useState<Set<string>>(new Set());
  const [collapsedStations, setCollapsedStations] = useState<Set<string>>(new Set());
  const [hallsInitialized, setHallsInitialized] = useState(false);

  // Favorites & ignored — persisted to localStorage
  const [favoritedHalls, setFavoritedHalls] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("favorited-halls") ?? "[]")); } catch { return new Set(); }
  });
  const [favoritedStations, setFavoritedStations] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("favorited-stations") ?? "[]")); } catch { return new Set(); }
  });
  const [ignoredStations, setIgnoredStations] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("ignored-stations") ?? "[]")); } catch { return new Set(); }
  });

  const toggleFavoriteHall = (e: React.MouseEvent, hall: string) => {
    e.stopPropagation();
    setFavoritedHalls((prev) => {
      const next = new Set(prev);
      next.has(hall) ? next.delete(hall) : next.add(hall);
      localStorage.setItem("favorited-halls", JSON.stringify([...next]));
      return next;
    });
  };

  const toggleFavoriteStation = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setFavoritedStations((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      localStorage.setItem("favorited-stations", JSON.stringify([...next]));
      return next;
    });
    // Un-ignore if favoriting
    setIgnoredStations((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      localStorage.setItem("ignored-stations", JSON.stringify([...next]));
      return next;
    });
  };

  const toggleIgnoredStation = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setIgnoredStations((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      localStorage.setItem("ignored-stations", JSON.stringify([...next]));
      return next;
    });
    // Un-favorite if ignoring
    setFavoritedStations((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      localStorage.setItem("favorited-stations", JSON.stringify([...next]));
      return next;
    });
  };

  // Auto-collapse closed halls on initial load
  useEffect(() => {
    if (hallsInitialized || Object.keys(itemsByDiningHall).length === 0) return;
    const closedHalls = Object.keys(itemsByDiningHall).filter(
      (hall) => getCurrentMealPeriod(hall, selectedDateTime) === null
    );
    if (closedHalls.length > 0) setCollapsedHalls(new Set(closedHalls));
    setHallsInitialized(true);
  }, [itemsByDiningHall, selectedDateTime, hallsInitialized]);

  const toggleHall = (hall: string) => {
    setCollapsedHalls((prev) => {
      const next = new Set(prev);
      next.has(hall) ? next.delete(hall) : next.add(hall);
      return next;
    });
  };

  const toggleStation = (hall: string, station: string) => {
    const key = `${hall}::${station}`;
    setCollapsedStations((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Strip trailing numbers so "Flame 1" and "Flame 3" group together as "Flame"
  const normalizeStation = (name: string | null) =>
    name ? name.replace(/\s+\d+$/, "").trim() : "Other";

  return (
    <>
    <div className="space-y-8">
      {/* Compact Sticky Filter Bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 backdrop-blur-lg border-b border-purple-100 dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Row: Date, Time, Search, Profile */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#C9A530] focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
            />
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#C9A530] focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
            />
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={showOnlyOpen}
                onChange={(e) => setShowOnlyOpen(e.target.checked)}
                className="w-4 h-4 text-purple-600 dark:text-[#C9A530] border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:focus:ring-[#C9A530]"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Open Only</span>
            </label>
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 w-full sm:min-w-[200px] px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#C9A530] focus:border-transparent dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
            <button
              onClick={() => setShowProfileModal(!showProfileModal)}
              className="px-4 py-2 bg-purple-600 dark:bg-gradient-to-r dark:from-[#C9A530] dark:via-[#EDD96A] dark:to-[#B8943A] text-white dark:text-gray-900 rounded-xl font-medium hover:bg-purple-700 dark:hover:from-[#A88928] dark:hover:via-[#D4BC50] dark:hover:to-[#9A7820] transition-all shadow-sm hover:shadow-md flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {userProfile.fitnessGoal ? "Profile" : "Setup"}
            </button>
            <ThemeToggle />
          </div>

          {/* Second Row: Hall, Meal, Dietary Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#C9A530] focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Halls</option>
              {diningHalls.map((hall) => (
                <option key={hall} value={hall}>
                  {hall.replace(" Dining Commons", "").replace("Foster Walker ", "FW")}
                </option>
              ))}
            </select>
            <select
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#C9A530] focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Meals</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
            {[
              { key: "vegetarian", label: "🌱 Vegetarian" },
              { key: "vegan", label: "🥬 Vegan" },
              { key: "glutenFree", label: "🌾 Gluten Free" },
              { key: "kosher", label: "✡️ Kosher" },
              { key: "dairyFree", label: "🥛 Dairy Free" },
              { key: "nutFree", label: "🥜 Nut Free" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleDietaryFilter(key as keyof typeof dietaryFilters)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  dietaryFilters[key as keyof typeof dietaryFilters]
                    ? "bg-purple-600 dark:bg-gradient-to-r dark:from-[#C9A530] dark:via-[#EDD96A] dark:to-[#B8943A] text-white dark:text-gray-900 shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      {activeTab === 'explore' && (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Results Count */}
        <div className="flex items-center justify-between px-2">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {Object.keys(itemsByDiningHall).length === 0
              ? "No Dining Halls Available"
              : `${Object.keys(itemsByDiningHall).length} Dining ${Object.keys(itemsByDiningHall).length === 1 ? "Hall" : "Halls"}`}
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} total
          </span>
        </div>

        {/* Dining Halls - Grouped Cards */}
        <div className="space-y-6">
          {Object.entries(itemsByDiningHall).sort(([hallA, a], [hallB, b]) => {
            const favA = favoritedHalls.has(hallA) ? 1 : 0;
            const favB = favoritedHalls.has(hallB) ? 1 : 0;
            if (favB !== favA) return favB - favA;
            const openA = getCurrentMealPeriod(hallA, selectedDateTime) !== null ? 1 : 0;
            const openB = getCurrentMealPeriod(hallB, selectedDateTime) !== null ? 1 : 0;
            if (openB !== openA) return openB - openA;
            const likedA = a.filter((i) => likes.includes(i.name)).length;
            const likedB = b.filter((i) => likes.includes(i.name)).length;
            return likedB - likedA;
          }).map(([diningHall, hallItems]) => {
            const currentMeal = getCurrentMealPeriod(diningHall, selectedDateTime);
            const isOpen = currentMeal !== null;
            const mealTime = currentMeal ? DINING_HALL_SCHEDULES[diningHall]?.meals[currentMeal as MealPeriod] : null;
            const isHallCollapsed = collapsedHalls.has(diningHall);
            const likedCount = hallItems.filter((i) => likes.includes(i.name)).length;

            // Group items by normalized station name, deduplicating by name across meal periods
            type MergedItem = MenuItem & { mealPeriods: string[] };
            const itemsByStation = hallItems.reduce((acc, item) => {
              const key = normalizeStation(item.station);
              if (!acc[key]) acc[key] = [];
              const existing = acc[key].find((i) => i.name === item.name);
              if (existing) {
                if (!existing.mealPeriods.includes(item.mealPeriod)) {
                  existing.mealPeriods.push(item.mealPeriod);
                }
              } else {
                acc[key].push({ ...item, mealPeriods: [item.mealPeriod] });
              }
              return acc;
            }, {} as Record<string, MergedItem[]>);

            return (
              <div
                key={diningHall}
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border-2 border-purple-100 dark:border-gray-700 transition-all duration-300"
              >
                {/* Clickable Dining Hall Header */}
                <div
                  onClick={() => toggleHall(diningHall)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" || e.key === " " ? toggleHall(diningHall) : undefined}
                  className={`w-full text-left px-4 py-4 sm:px-8 sm:py-6 cursor-pointer ${
                    isOpen
                      ? "bg-purple-600 dark:bg-gradient-to-r dark:from-[#C9A530] dark:via-[#EDD96A] dark:to-[#B8943A]"
                      : "bg-gray-500 dark:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-white dark:text-gray-900">
                          {diningHall.replace(" Dining Commons", "").replace("Foster Walker ", "Foster Walker")}
                        </h3>
                        {likedCount > 0 && (
                          <div className="relative flex items-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-lg bg-green-300 opacity-60"></span>
                            <span className="relative flex items-center gap-1.5 px-2.5 py-1 bg-green-500 text-white text-xs font-black rounded-lg shadow-md">
                              👍 {likedCount}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-white/90 dark:text-gray-900/80">
                        {isOpen && currentMeal && mealTime ? (
                          <>
                            <span className="text-sm font-medium capitalize">{currentMeal}</span>
                            <span className="text-sm">•</span>
                            <span className="text-sm">{formatMealTime(mealTime)}</span>
                          </>
                        ) : (
                          <span className="text-sm font-medium">Closed</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-3">
                      {isOpen && (
                        <div className="flex items-center gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-white/30 backdrop-blur-md rounded-2xl shadow-lg border-2 border-white/50">
                          <span className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-400 shadow-lg"></span>
                          </span>
                          <span className="hidden sm:inline text-white dark:text-gray-900 font-black text-sm tracking-wide drop-shadow-lg">OPEN NOW</span>
                        </div>
                      )}
                      <span className="hidden sm:inline text-white/80 dark:text-gray-900/70 text-xs font-medium">
                        {hallItems.length} items
                      </span>
                      <button
                        onClick={(e) => toggleFavoriteHall(e, diningHall)}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                        title={favoritedHalls.has(diningHall) ? "Unfavorite" : "Favorite"}
                      >
                        <svg
                          className={`w-5 h-5 transition-colors ${favoritedHalls.has(diningHall) ? "text-purple-300 dark:text-[#EDD96A] fill-current" : "text-white/60 dark:text-gray-900/50"}`}
                          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          fill={favoritedHalls.has(diningHall) ? "currentColor" : "none"}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <svg
                        className={`w-5 h-5 text-white dark:text-gray-900 transition-transform duration-200 ${isHallCollapsed ? "-rotate-90" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Collapsible body: stations */}
                {!isHallCollapsed && (
                  <div className="p-4 sm:p-6 space-y-4">
                    {Object.entries(itemsByStation).sort(([nameA, a], [nameB, b]) => {
                      const keyA = `${diningHall}::${nameA}`;
                      const keyB = `${diningHall}::${nameB}`;
                      const favA = favoritedStations.has(keyA) ? 1 : 0;
                      const favB = favoritedStations.has(keyB) ? 1 : 0;
                      if (favB !== favA) return favB - favA;
                      const ignA = ignoredStations.has(keyA) ? 1 : 0;
                      const ignB = ignoredStations.has(keyB) ? 1 : 0;
                      if (ignB !== ignA) return ignA - ignB;
                      const hasLikedA = a.some((i) => likes.includes(i.name)) ? 1 : 0;
                      const hasLikedB = b.some((i) => likes.includes(i.name)) ? 1 : 0;
                      if (hasLikedB !== hasLikedA) return hasLikedB - hasLikedA;
                      const maxA = Math.max(...a.map((i) => i.calories ?? 0));
                      const maxB = Math.max(...b.map((i) => i.calories ?? 0));
                      return maxB - maxA;
                    }).map(([stationName, stationItems]) => {
                      const stationKey = `${diningHall}::${stationName}`;
                      const isStationCollapsed = collapsedStations.has(stationKey);
                      const isStationFavorited = favoritedStations.has(stationKey);
                      const isStationIgnored = ignoredStations.has(stationKey);

                      return (
                        <div key={stationName} className={`rounded-2xl border overflow-hidden ${isStationIgnored ? "border-gray-200 dark:border-gray-700 opacity-60" : "border-purple-100 dark:border-gray-700"}`}>
                          {/* Station header */}
                          <div className={`flex items-center justify-between px-4 py-3 ${isStationIgnored ? "bg-gray-50 dark:bg-gray-800/50" : "bg-purple-50 dark:bg-gray-800"}`}>
                            <button
                              onClick={() => toggleStation(diningHall, stationName)}
                              className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity"
                            >
                              <span className={`font-semibold text-sm ${isStationIgnored ? "text-gray-400 dark:text-gray-500" : "text-purple-700 dark:text-[#C9A530]"}`}>{stationName}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{stationItems.length} item{stationItems.length !== 1 ? "s" : ""}</span>
                              <svg
                                className={`w-4 h-4 transition-transform duration-200 ${isStationIgnored ? "text-gray-400 dark:text-gray-500" : "text-purple-500 dark:text-[#C9A530]"} ${isStationCollapsed ? "-rotate-90" : ""}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={(e) => toggleFavoriteStation(e, stationKey)}
                                className="p-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
                                title={isStationFavorited ? "Unfavorite station" : "Favorite station"}
                              >
                                <svg
                                  className={`w-4 h-4 transition-colors ${isStationFavorited ? "text-purple-600 dark:text-[#EDD96A]" : "text-gray-300 dark:text-gray-600 hover:text-purple-400 dark:hover:text-[#C9A530]"}`}
                                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                  fill={isStationFavorited ? "currentColor" : "none"}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => toggleIgnoredStation(e, stationKey)}
                                className={`p-1.5 rounded-lg transition-colors font-bold text-sm leading-none ${isStationIgnored ? "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300" : "text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-400"}`}
                                title={isStationIgnored ? "Un-ignore station" : "Don't care about this station"}
                              >
                                −
                              </button>
                            </div>
                          </div>

                          {/* Station items grid */}
                          {!isStationCollapsed && (
                            <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {[...stationItems].sort((a, b) => {
                                const likedA = likes.includes(a.name) ? 1 : 0;
                                const likedB = likes.includes(b.name) ? 1 : 0;
                                if (likedB !== likedA) return likedB - likedA;
                                const dislikedA = dislikes.includes(a.name) ? 1 : 0;
                                const dislikedB = dislikes.includes(b.name) ? 1 : 0;
                                if (dislikedB !== dislikedA) return dislikedA - dislikedB;
                                return (b.calories ?? 0) - (a.calories ?? 0);
                              }).map((item) => {
                                const isDisliked = dislikes.includes(item.name);
                                return isDisliked ? (
                                  /* Collapsed disliked item */
                                  <div
                                    key={item.id}
                                    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center justify-between gap-2 opacity-70"
                                  >
                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.name}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePreference(item.name, "dislike");
                                      }}
                                      className="p-1 rounded-lg bg-red-100 text-red-500 border border-red-200 flex-shrink-0"
                                      title="Remove from dislikes"
                                    >
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-6h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                <div
                                  key={item.id}
                                  className="bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-[#C9A530] hover:shadow-lg transition-all duration-200 p-4 group cursor-pointer"
                                >
                                  {/* Item Header */}
                                  <div className="mb-3">
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 group-hover:text-purple-700 dark:group-hover:text-[#C9A530] transition-colors">
                                      {item.name}
                                    </h4>
                                    <span className="capitalize text-xs font-medium text-purple-600 dark:text-[#C9A530]">{item.mealPeriods.join(" · ")}</span>
                                  </div>

                                  {/* Nutrition Info */}
                                  {item.calories && (
                                    <div className="mb-3 p-2 bg-purple-50 dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-gray-600">
                                      <div className="grid grid-cols-2 gap-1 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Cal</span>
                                          <span className="font-bold text-gray-900 dark:text-white">{item.calories}</span>
                                        </div>
                                        {item.protein && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Protein</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{item.protein}g</span>
                                          </div>
                                        )}
                                        {item.carbs && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Carbs</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{item.carbs}g</span>
                                          </div>
                                        )}
                                        {item.fat && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Fat</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{item.fat}g</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Dietary Tags + Like/Dislike */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex flex-wrap gap-1 flex-1">
                                      {item.isVegetarian && (
                                        <span className="px-2 py-1 bg-gradient-to-r from-green-200 via-emerald-200 to-teal-200 text-green-800 text-xs rounded-full font-bold border border-green-300">
                                          🌱 Veg
                                        </span>
                                      )}
                                      {item.isVegan && (
                                        <span className="px-2 py-1 bg-gradient-to-r from-lime-200 via-green-200 to-emerald-200 text-green-800 text-xs rounded-full font-bold border border-green-300">
                                          🥬 Vegan
                                        </span>
                                      )}
                                      {item.isGlutenFree && (
                                        <span className="px-2 py-1 bg-gradient-to-r from-blue-200 via-cyan-200 to-sky-200 text-blue-800 text-xs rounded-full font-bold border border-blue-300">
                                          🌾 GF
                                        </span>
                                      )}
                                      {item.isKosher && (
                                        <span className="px-2 py-1 bg-gradient-to-r from-purple-200 via-violet-200 to-indigo-200 text-purple-800 text-xs rounded-full font-bold border border-purple-300">
                                          ✡️ Kosher
                                        </span>
                                      )}
                                      {item.isDairyFree && (
                                        <span className="px-2 py-1 bg-gradient-to-r from-yellow-200 via-amber-200 to-orange-200 text-yellow-800 text-xs rounded-full font-bold border border-yellow-300">
                                          🥛 DF
                                        </span>
                                      )}
                                      {item.isNutFree && (
                                        <span className="px-2 py-1 bg-gradient-to-r from-orange-200 via-red-200 to-rose-200 text-orange-800 text-xs rounded-full font-bold border border-orange-300">
                                          🥜 NF
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (likes.includes(item.name)) {
                                            handleRemovePreference(item.name, "like");
                                          } else {
                                            handleAddPreference(item.name, "like");
                                          }
                                        }}
                                        className={`p-1.5 rounded-lg transition-all ${
                                          likes.includes(item.name)
                                            ? "bg-green-100 text-green-600 border border-green-300"
                                            : "text-gray-400 hover:text-green-500 hover:bg-green-50 border border-transparent"
                                        }`}
                                        title={likes.includes(item.name) ? "Remove from likes" : "Add to likes"}
                                      >
                                        <svg className="w-4 h-4" fill={likes.includes(item.name) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (dislikes.includes(item.name)) {
                                            handleRemovePreference(item.name, "dislike");
                                          } else {
                                            handleAddPreference(item.name, "dislike");
                                          }
                                        }}
                                        className={`p-1.5 rounded-lg transition-all ${
                                          dislikes.includes(item.name)
                                            ? "bg-red-100 text-red-600 border border-red-300"
                                            : "text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent"
                                        }`}
                                        title={dislikes.includes(item.name) ? "Remove from dislikes" : "Add to dislikes"}
                                      >
                                        <svg className="w-4 h-4" fill={dislikes.includes(item.name) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-6h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-purple-50 dark:bg-gray-900 rounded-3xl shadow-xl border-2 border-purple-200 dark:border-gray-700">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-200 dark:bg-gray-700 rounded-3xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-purple-600 dark:text-[#C9A530]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No items found</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Try adjusting your filters or check back later when dining halls are open.
            </p>
          </div>
        )}
      </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <RecommendationsTab
          userProfile={userProfile}
          availableItems={filteredItems}
          diningHall={selectedHall !== "all" ? selectedHall : undefined}
          mealPeriod={selectedMeal !== "all" ? selectedMeal : undefined}
          consumedTotals={consumedTotals}
          likes={likes}
          dislikes={dislikes}
        />
      )}

      {/* Today's Meals Tab */}
      {activeTab === 'today' && (
        <TodaysMealsTab userProfile={userProfile} />
      )}

    </div>

    {/* Profile Card */}
    <UserProfileModal
      isOpen={showProfileModal}
      onClose={() => setShowProfileModal(false)}
      onSave={handleSaveProfile}
      initialProfile={userProfile}
      likes={likes}
      dislikes={dislikes}
      onAddPreference={handleAddPreference}
      onRemovePreference={handleRemovePreference}
    />
    </>
  );
}
