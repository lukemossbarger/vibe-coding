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

  return (
    <>
    <div className="space-y-8">
      {/* Compact Sticky Filter Bar */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-white via-purple-50/50 to-blue-50/50 backdrop-blur-lg border-b border-purple-100 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Row: Date, Time, Search, Profile */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={showOnlyOpen}
                onChange={(e) => setShowOnlyOpen(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">Open Only</span>
            </label>
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowProfileModal(!showProfileModal)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {userProfile.fitnessGoal ? "Profile" : "Setup"}
            </button>
          </div>

          {/* Second Row: Hall, Meal, Dietary Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
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
              className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="all">All Meals</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  dietaryFilters[key as keyof typeof dietaryFilters]
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
        {/* AI Recommendations Section */}
        <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 rounded-3xl shadow-xl p-8 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">AI Meal Recommendations</h2>
              <p className="text-sm text-gray-600">Personalized suggestions based on your profile</p>
            </div>
          </div>
          {filteredItems.length > 0 ? (
            <Recommendations
              userProfile={userProfile}
              availableItems={filteredItems}
              diningHall={selectedHall !== "all" ? selectedHall : undefined}
              mealPeriod={selectedMeal !== "all" ? selectedMeal : undefined}
            />
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <p className="text-sm text-blue-900 font-medium">
                No menu items available for the selected filters. Try adjusting your date, time, or filters.
              </p>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between px-2">
          <h3 className="text-2xl font-bold text-gray-900">
            {Object.keys(itemsByDiningHall).length === 0
              ? "No Dining Halls Available"
              : `${Object.keys(itemsByDiningHall).length} Dining ${Object.keys(itemsByDiningHall).length === 1 ? "Hall" : "Halls"}`}
          </h3>
          <span className="text-sm text-gray-600 font-medium">
            {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} total
          </span>
        </div>

        {/* Dining Halls - Grouped Cards */}
        <div className="space-y-6">
          {Object.entries(itemsByDiningHall).map(([diningHall, hallItems]) => {
            const currentMeal = getCurrentMealPeriod(diningHall, selectedDateTime);
            const isOpen = currentMeal !== null;
            const mealTime = currentMeal ? DINING_HALL_SCHEDULES[diningHall]?.meals[currentMeal as MealPeriod] : null;

            return (
              <div
                key={diningHall}
                className="bg-gradient-to-br from-white via-purple-50/20 to-blue-50/30 rounded-3xl shadow-xl overflow-hidden border-2 border-purple-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                {/* Dining Hall Header with Vibrant Gradient */}
                <div className={`px-8 py-6 ${
                  isOpen
                    ? "bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 shadow-lg"
                    : "bg-gradient-to-r from-slate-400 via-gray-500 to-slate-500"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {diningHall.replace(" Dining Commons", "").replace("Foster Walker ", "Foster Walker")}
                      </h3>
                      <div className="flex items-center gap-3 text-white/90">
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
                    {isOpen && (
                      <div className="flex items-center gap-2 px-5 py-2.5 bg-white/30 backdrop-blur-md rounded-2xl shadow-lg border-2 border-white/50">
                        <span className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-400 shadow-lg"></span>
                        </span>
                        <span className="text-white font-black text-base tracking-wide drop-shadow-lg">OPEN NOW</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hallItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gradient-to-br from-white via-purple-50/30 to-blue-50/40 rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl hover:scale-105 transition-all duration-300 p-5 group cursor-pointer"
                      >
                        {/* Item Header */}
                        <div className="mb-3">
                          <h4 className="font-semibold text-base text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="capitalize font-medium text-purple-600">{item.mealPeriod}</span>
                            {item.station && (
                              <>
                                <span>•</span>
                                <span className="font-medium">{item.station}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Nutrition Info */}
                        {item.calories && (
                          <div className="mb-3 p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 shadow-sm">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cal</span>
                                <span className="font-bold text-gray-900">{item.calories}</span>
                              </div>
                              {item.protein && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Protein</span>
                                  <span className="font-bold text-gray-900">{item.protein}g</span>
                                </div>
                              )}
                              {item.carbs && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Carbs</span>
                                  <span className="font-bold text-gray-900">{item.carbs}g</span>
                                </div>
                              )}
                              {item.fat && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Fat</span>
                                  <span className="font-bold text-gray-900">{item.fat}g</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Dietary Tags + Like/Dislike */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {item.isVegetarian && (
                              <span className="px-3 py-1.5 bg-gradient-to-r from-green-200 via-emerald-200 to-teal-200 text-green-800 text-xs rounded-full font-bold shadow-md border-2 border-green-300">
                                🌱 Vegetarian
                              </span>
                            )}
                            {item.isVegan && (
                              <span className="px-3 py-1.5 bg-gradient-to-r from-lime-200 via-green-200 to-emerald-200 text-green-800 text-xs rounded-full font-bold shadow-md border-2 border-green-300">
                                🥬 Vegan
                              </span>
                            )}
                            {item.isGlutenFree && (
                              <span className="px-3 py-1.5 bg-gradient-to-r from-blue-200 via-cyan-200 to-sky-200 text-blue-800 text-xs rounded-full font-bold shadow-md border-2 border-blue-300">
                                🌾 GF
                              </span>
                            )}
                            {item.isKosher && (
                              <span className="px-3 py-1.5 bg-gradient-to-r from-purple-200 via-violet-200 to-indigo-200 text-purple-800 text-xs rounded-full font-bold shadow-md border-2 border-purple-300">
                                ✡️ Kosher
                              </span>
                            )}
                            {item.isDairyFree && (
                              <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-200 via-amber-200 to-orange-200 text-yellow-800 text-xs rounded-full font-bold shadow-md border-2 border-yellow-300">
                                🥛 DF
                              </span>
                            )}
                            {item.isNutFree && (
                              <span className="px-3 py-1.5 bg-gradient-to-r from-orange-200 via-red-200 to-rose-200 text-orange-800 text-xs rounded-full font-bold shadow-md border-2 border-orange-300">
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
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl shadow-xl border-2 border-purple-200">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 rounded-3xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
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
