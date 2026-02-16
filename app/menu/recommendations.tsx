"use client";

import { useState } from "react";
import { UserProfile } from "@/lib/types/user-profile";

interface RecommendationsProps {
  userProfile: UserProfile;
  availableItems: any[];
  diningHall?: string;
  mealPeriod?: string;
}

export function Recommendations({
  userProfile,
  availableItems,
  diningHall,
  mealPeriod,
}: RecommendationsProps) {
  const [recommendation, setRecommendation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const getRecommendations = async () => {
    setLoading(true);
    setError("");
    setRecommendation("");

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userProfile,
          availableItems: availableItems.slice(0, 50), // Limit to first 50 items to avoid token limits
          diningHall,
          mealPeriod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get recommendations");
      }

      const data = await response.json();
      setRecommendation(data.recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const hasEnoughInfo = userProfile.fitnessGoal || userProfile.targetCalories;

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={getRecommendations}
          disabled={loading || !hasEnoughInfo || availableItems.length === 0}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            loading || !hasEnoughInfo || availableItems.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
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
          ) : (
            "Get Recommendations"
          )}
        </button>
      </div>

      {!hasEnoughInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            ⬆️ Click "Set Up Profile" above to get personalized meal recommendations!
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {recommendation && (
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {recommendation}
          </div>
        </div>
      )}

      {!recommendation && !loading && !error && (
        <p className="text-gray-500 text-center py-8">
          Click "Get Recommendations" to receive AI-powered meal suggestions based on your goals.
        </p>
      )}
    </div>
  );
}
