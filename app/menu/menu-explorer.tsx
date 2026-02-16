"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DINING_HALL_SCHEDULES,
  getCurrentMealPeriod,
  isDiningHallOpen,
  formatMealTime,
  type MealPeriod,
} from "@/lib/dining-halls/schedule";
import { UserProfile } from "@/lib/types/user-profile";
import { UserProfileModal } from "./user-profile-modal";
import { Recommendations } from "./recommendations";

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
  // Initialize with current date and time
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<string>(
    now.toISOString().split("T")[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
  );
  const [selectedHall, setSelectedHall] = useState<string>("all");
  const [selectedMeal, setSelectedMeal] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyOpen, setShowOnlyOpen] = useState(true);
  const [dietaryFilters, setDietaryFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    kosher: false,
    dairyFree: false,
    nutFree: false,
  });

  // User profile state with localStorage persistence
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load profile from localStorage after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      try {
        setUserProfile(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save profile to localStorage when it changes
  const handleSaveProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    if (typeof window !== "undefined") {
      localStorage.setItem("userProfile", JSON.stringify(profile));
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
      // Filter by date (only show items for selected date)
      const itemDate = new Date(item.date);
      const selectedDateOnly = new Date(selectedDate);
      if (
        itemDate.getFullYear() !== selectedDateOnly.getFullYear() ||
        itemDate.getMonth() !== selectedDateOnly.getMonth() ||
        itemDate.getDate() !== selectedDateOnly.getDate()
      ) {
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

  const toggleDietaryFilter = (filter: keyof typeof dietaryFilters) => {
    setDietaryFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  return (
    <div className="space-y-6">
      {/* AI Recommendations with Profile Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">AI Meal Recommendations</h2>
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {userProfile.fitnessGoal ? "Edit Profile" : "Set Up Profile"}
          </button>
        </div>
        {filteredItems.length > 0 ? (
          <Recommendations
            userProfile={userProfile}
            availableItems={filteredItems}
            diningHall={selectedHall !== "all" ? selectedHall : undefined}
            mealPeriod={selectedMeal !== "all" ? selectedMeal : undefined}
          />
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              No menu items available for the selected filters. Try adjusting your date, time, or filters.
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Date and Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyOpen}
                onChange={(e) => setShowOnlyOpen(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Show only open dining halls
              </span>
            </label>
          </div>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Search for a dish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Dining Hall and Meal Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dining Hall
            </label>
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Dining Halls</option>
              {diningHalls.map((hall) => (
                <option key={hall} value={hall}>
                  {hall}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meal Period
            </label>
            <select
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Meals</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>
        </div>

        {/* Dietary Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dietary Preferences
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "vegetarian", label: "Vegetarian" },
              { key: "vegan", label: "Vegan" },
              { key: "glutenFree", label: "Gluten Free" },
              { key: "kosher", label: "Kosher" },
              { key: "dairyFree", label: "Dairy Free" },
              { key: "nutFree", label: "Nut Free" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleDietaryFilter(key as keyof typeof dietaryFilters)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dietaryFilters[key as keyof typeof dietaryFilters]
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dining Hall Status */}
        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dining Hall Status
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(DINING_HALL_SCHEDULES).map(([hallName, schedule]) => {
              const currentMeal = getCurrentMealPeriod(hallName, selectedDateTime);
              const isOpen = currentMeal !== null;
              const mealTime = currentMeal ? schedule.meals[currentMeal as MealPeriod] : null;

              return (
                <div
                  key={hallName}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    isOpen
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <div className="font-medium">{hallName.replace(" Dining Commons", "").replace("Foster Walker ", "")}</div>
                  <div className="text-xs">
                    {isOpen && currentMeal && mealTime ? (
                      <>
                        <span className="capitalize">{currentMeal}</span> ({formatMealTime(mealTime)})
                      </>
                    ) : (
                      "Closed"
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600 pt-2 border-t">
          Showing {filteredItems.length} items
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isHallOpen = isDiningHallOpen(item.diningHall, selectedDateTime);
          const currentMeal = getCurrentMealPeriod(item.diningHall, selectedDateTime);

          return (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4"
            >
              <div className="mb-3">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-lg text-gray-900 flex-1">
                    {item.name}
                  </h3>
                  {isHallOpen && currentMeal === item.mealPeriod && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0">
                      Open Now
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{item.diningHall}</span>
                  <span>•</span>
                  <span className="capitalize">{item.mealPeriod}</span>
                  {item.station && (
                    <>
                      <span>•</span>
                      <span className="text-purple-600 font-medium">{item.station}</span>
                    </>
                  )}
                </div>
              </div>

            {/* Nutrition Info */}
            {item.calories && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Calories:</span>
                    <span className="ml-1 font-medium">{item.calories}</span>
                  </div>
                  {item.protein && (
                    <div>
                      <span className="text-gray-600">Protein:</span>
                      <span className="ml-1 font-medium">{item.protein}g</span>
                    </div>
                  )}
                  {item.carbs && (
                    <div>
                      <span className="text-gray-600">Carbs:</span>
                      <span className="ml-1 font-medium">{item.carbs}g</span>
                    </div>
                  )}
                  {item.fat && (
                    <div>
                      <span className="text-gray-600">Fat:</span>
                      <span className="ml-1 font-medium">{item.fat}g</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dietary Tags */}
            <div className="flex flex-wrap gap-1">
              {item.isVegetarian && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Vegetarian
                </span>
              )}
              {item.isVegan && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Vegan
                </span>
              )}
              {item.isGlutenFree && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Gluten Free
                </span>
              )}
              {item.isKosher && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Kosher
                </span>
              )}
              {item.isDairyFree && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                  Dairy Free
                </span>
              )}
              {item.isNutFree && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  Nut Free
                </span>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No items found matching your filters
          </p>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
        initialProfile={userProfile}
      />
    </div>
  );
}
