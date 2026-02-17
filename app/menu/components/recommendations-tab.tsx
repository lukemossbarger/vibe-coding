"use client";

import { useState, useEffect, useCallback } from "react";
import { UserProfile } from "@/lib/types/user-profile";
import { MenuItem, NutritionTotals } from "@/lib/types/meal-tracking";
import { useMealStore } from "@/lib/stores/meal-store";

interface RawRecommendation {
  title: string;
  description: string;
  items: string[]; // exact item names from LLM
}

interface ResolvedRecommendation {
  title: string;
  description: string;
  itemNames: string[];
  matchedItems: MenuItem[];
}

interface StoredRecommendations {
  recommendations: RawRecommendation[];
  fullText: string;
  timestamp: number;
}

const STORAGE_KEY = "ai-recommendations-cache";

function loadCachedRecommendations(): StoredRecommendations | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as StoredRecommendations;
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedRecommendations(recs: RawRecommendation[], fullText: string) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ recommendations: recs, fullText, timestamp: Date.now() })
    );
  } catch {}
}

function matchItemByName(name: string, available: MenuItem[]): MenuItem | undefined {
  const lower = name.toLowerCase().trim();
  // Exact match
  const exact = available.find((i) => i.name.toLowerCase() === lower);
  if (exact) return exact;
  // Item name contains search or vice versa
  const partial = available.find(
    (i) =>
      i.name.toLowerCase().includes(lower) || lower.includes(i.name.toLowerCase())
  );
  return partial;
}

function resolveItems(
  raw: RawRecommendation,
  available: MenuItem[]
): ResolvedRecommendation {
  const matchedItems: MenuItem[] = [];
  const matchedIds = new Set<string>();

  // First: match from the explicit ITEMS list
  const items = Array.isArray(raw.items) ? raw.items : [];
  for (const name of items) {
    const match = matchItemByName(name, available);
    if (match && !matchedIds.has(match.id)) {
      matchedItems.push(match);
      matchedIds.add(match.id);
    }
  }

  // Fallback: scan description for item names if ITEMS list was empty or had no matches
  if (matchedItems.length === 0) {
    const combined = `${raw.title} ${raw.description}`.toLowerCase();
    const sorted = [...available].sort((a, b) => b.name.length - a.name.length);
    for (const item of sorted) {
      if (item.name.length < 4 || matchedIds.has(item.id)) continue;
      if (combined.includes(item.name.toLowerCase())) {
        matchedItems.push(item);
        matchedIds.add(item.id);
      }
    }
  }

  return {
    title: raw.title,
    description: raw.description,
    itemNames: items,
    matchedItems,
  };
}

interface RecommendationsTabProps {
  userProfile: UserProfile;
  availableItems: MenuItem[];
  diningHall?: string;
  mealPeriod?: string;
  consumedTotals: NutritionTotals;
}

export function RecommendationsTab({
  userProfile,
  availableItems,
  diningHall,
  mealPeriod,
  consumedTotals,
}: RecommendationsTabProps) {
  const [recommendations, setRecommendations] = useState<ResolvedRecommendation[]>([]);
  const [fullText, setFullText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [addingAllIndex, setAddingAllIndex] = useState<number | null>(null);

  const addMeal = useMealStore((state) => state.addMeal);

  const buildRecs = useCallback(
    (raw: RawRecommendation[]): ResolvedRecommendation[] =>
      raw.map((r) => resolveItems(r, availableItems)),
    [availableItems]
  );

  // Load cached on mount
  useEffect(() => {
    const cached = loadCachedRecommendations();
    if (cached && cached.recommendations.length > 0) {
      setRecommendations(buildRecs(cached.recommendations));
      setFullText(cached.fullText);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-match when filters change
  useEffect(() => {
    setRecommendations((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((r) =>
        resolveItems(
          { title: r.title, description: r.description, items: r.itemNames },
          availableItems
        )
      );
    });
  }, [availableItems]);

  const getRecommendations = async () => {
    setLoading(true);
    setError("");
    setRecommendations([]);
    setFullText("");
    setAddedKeys(new Set());

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile,
          availableItems: availableItems,
          diningHall,
          mealPeriod,
          consumedTotals,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get recommendations");
      }

      const data = await response.json();

      if (data.recommendations && Array.isArray(data.recommendations)) {
        const raw: RawRecommendation[] = data.recommendations.map(
          (r: { title: string; description: string; items?: string[] }) => ({
            title: r.title,
            description: r.description,
            items: r.items || [],
          })
        );
        setRecommendations(buildRecs(raw));
        saveCachedRecommendations(raw, data.fullText || "");
        if (data.fullText) setFullText(data.fullText);
      } else if (data.fullText) {
        setFullText(data.fullText);
        saveCachedRecommendations([], data.fullText);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = useCallback(
    async (item: MenuItem, recIndex: number) => {
      const key = `${recIndex}-${item.id}`;
      setAddingKey(key);
      try {
        await addMeal(item, "recommendation");
        setAddedKeys((prev) => new Set(prev).add(key));
      } catch (err) {
        console.error("Failed to add meal:", err);
      } finally {
        setAddingKey(null);
      }
    },
    [addMeal]
  );

  const handleAddAll = useCallback(
    async (items: MenuItem[], recIndex: number) => {
      setAddingAllIndex(recIndex);
      try {
        for (const item of items) {
          const key = `${recIndex}-${item.id}`;
          if (!addedKeys.has(key)) {
            await addMeal(item, "recommendation");
            setAddedKeys((prev) => new Set(prev).add(key));
          }
        }
      } catch (err) {
        console.error("Failed to add meals:", err);
      } finally {
        setAddingAllIndex(null);
      }
    },
    [addMeal, addedKeys]
  );

  const allItemsAdded = useCallback(
    (items: MenuItem[], recIndex: number) =>
      items.length > 0 && items.every((item) => addedKeys.has(`${recIndex}-${item.id}`)),
    [addedKeys]
  );

  const hasEnoughInfo = userProfile.fitnessGoal || userProfile.targetCalories;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800">
              AI-Powered Recommendations
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Get personalized meal suggestions based on your nutrition goals
            </p>
          </div>
          <button
            onClick={getRecommendations}
            disabled={loading || !hasEnoughInfo || availableItems.length === 0}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              loading || !hasEnoughInfo || availableItems.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:scale-105"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </span>
            ) : recommendations.length > 0 ? (
              "Refresh Recommendations"
            ) : (
              "Generate Recommendations"
            )}
          </button>
        </div>

        {!hasEnoughInfo && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800 font-semibold">
              Click "Set Up Profile" to get personalized meal recommendations!
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800 font-semibold">{error}</p>
          </div>
        )}
      </div>

      {/* Recommendation Cards */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-xl overflow-hidden flex flex-col"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center font-black text-lg text-white flex-shrink-0">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-white">{rec.title}</h3>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                {/* AI Description */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {rec.description}
                  </p>
                </div>

                {/* Matched Menu Items */}
                {rec.matchedItems.length > 0 && (
                  <div className="space-y-3 mt-auto">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Menu Items in This Meal
                    </p>
                    {rec.matchedItems.map((item) => {
                      const key = `${index}-${item.id}`;
                      const isAdded = addedKeys.has(key);
                      const isAdding = addingKey === key;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-800 truncate">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              {item.calories != null && <span>{item.calories} cal</span>}
                              {item.protein != null && (
                                <>
                                  <span>-</span>
                                  <span>{item.protein}g protein</span>
                                </>
                              )}
                              {item.sugar != null && (
                                <>
                                  <span>-</span>
                                  <span>{item.sugar}g sugar</span>
                                </>
                              )}
                              {item.station && (
                                <>
                                  <span>-</span>
                                  <span>{item.station}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddItem(item, index)}
                            disabled={isAdding || isAdded}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                              isAdded
                                ? "bg-green-500 text-white"
                                : isAdding
                                ? "bg-gray-300 text-gray-500"
                                : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-md"
                            }`}
                          >
                            {isAdded ? "Added" : isAdding ? "..." : "+ Add"}
                          </button>
                        </div>
                      );
                    })}

                    {/* Add Entire Meal button */}
                    <button
                      onClick={() => handleAddAll(rec.matchedItems, index)}
                      disabled={addingAllIndex === index || allItemsAdded(rec.matchedItems, index)}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all mt-1 ${
                        allItemsAdded(rec.matchedItems, index)
                          ? "bg-green-500 text-white"
                          : addingAllIndex === index
                          ? "bg-gray-300 text-gray-500"
                          : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:scale-[1.02]"
                      }`}
                    >
                      {allItemsAdded(rec.matchedItems, index)
                        ? "All Items Added"
                        : addingAllIndex === index
                        ? "Adding..."
                        : "Add Entire Meal"}
                    </button>
                  </div>
                )}

                {rec.matchedItems.length === 0 && (
                  <div className="mt-auto pt-2">
                    <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 text-center text-sm font-medium">
                      Could not match menu items
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fallback: Full text */}
      {fullText && recommendations.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {fullText}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!recommendations.length && !fullText && !loading && !error && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p className="text-xl font-semibold text-gray-700 mb-2">
            Ready to discover your perfect meals?
          </p>
          <p className="text-gray-500">
            Click "Generate Recommendations" to receive AI-powered meal suggestions
          </p>
        </div>
      )}
    </div>
  );
}
