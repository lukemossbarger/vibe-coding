"use client";

import { useState, useEffect, useRef } from "react";
import {
  UserProfile,
  FitnessGoal,
  ActivityLevel,
  Gender,
  calculateTDEE,
  calculateMacros,
} from "@/lib/types/user-profile";

interface UserProfileCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
  likes: string[];
  dislikes: string[];
  onAddPreference: (name: string, type: "like" | "dislike") => void;
  onRemovePreference: (name: string, type: "like" | "dislike") => void;
}

export function UserProfileCard({
  isOpen,
  onClose,
  onSave,
  initialProfile,
  likes,
  dislikes,
  onAddPreference,
  onRemovePreference,
}: UserProfileCardProps) {
  const [profile, setProfile] = useState<UserProfile>({
    activityLevel: "moderate",
    fitnessGoal: "maintain",
    age: undefined,
    gender: undefined,
    height: undefined,
    weight: undefined,
    ...initialProfile,
  });
  const [likeInput, setLikeInput] = useState("");
  const [dislikeInput, setDislikeInput] = useState("");
  const likeInputRef = useRef<HTMLInputElement>(null);
  const dislikeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProfile({
        activityLevel: "moderate",
        fitnessGoal: "maintain",
        age: undefined,
        gender: undefined,
        height: undefined,
        weight: undefined,
        ...initialProfile,
      });
    }
  }, [isOpen, initialProfile]);

  const handleSave = () => {
    if (profile.weight && profile.height && profile.age && profile.gender) {
      const tdee = calculateTDEE(profile);
      if (tdee && profile.fitnessGoal) {
        const macros = calculateMacros(tdee, profile.fitnessGoal, profile.weight);
        onSave({
          ...profile,
          targetCalories: tdee,
          targetProtein: macros.protein,
          targetCarbs: macros.carbs,
          targetFat: macros.fat,
        });
        return;
      }
    }
    onSave(profile);
  };

  const handleAddLike = () => {
    const trimmed = likeInput.trim();
    if (trimmed && !likes.includes(trimmed)) {
      onAddPreference(trimmed, "like");
      setLikeInput("");
      likeInputRef.current?.focus();
    }
  };

  const handleAddDislike = () => {
    const trimmed = dislikeInput.trim();
    if (trimmed && !dislikes.includes(trimmed)) {
      onAddPreference(trimmed, "dislike");
      setDislikeInput("");
      dislikeInputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 w-[calc(100vw-2rem)] max-w-[380px] z-40 max-h-[calc(100vh-5rem)]">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-purple-200 dark:border-gray-700 shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-purple-200 dark:border-gray-700 bg-purple-50 dark:bg-gray-800 flex-shrink-0">
          <h2 className="text-lg font-black text-purple-600 dark:bg-gradient-to-r dark:from-[#C9A530] dark:via-[#EDD96A] dark:to-[#B8943A] dark:bg-clip-text dark:text-transparent">
            Your Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Physical Attributes */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Physical Attributes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Age</label>
                <input
                  type="number"
                  value={profile.age ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, age: val ? parseInt(val) : undefined });
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#C9A530] focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Gender</label>
                <select
                  value={profile.gender ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, gender: val ? (val as Gender) : undefined });
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#C9A530] focus:border-transparent dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Height (in)</label>
                <input
                  type="number"
                  value={profile.height ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, height: val ? parseInt(val) : undefined });
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#C9A530] focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Weight (lbs)</label>
                <input
                  type="number"
                  value={profile.weight ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, weight: val ? parseInt(val) : undefined });
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#C9A530] focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="180"
                />
              </div>
            </div>
          </div>

          {/* Goals */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Goals</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Activity Level</label>
                <select
                  value={profile.activityLevel || "moderate"}
                  onChange={(e) =>
                    setProfile({ ...profile, activityLevel: e.target.value as ActivityLevel })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#C9A530] focus:border-transparent dark:bg-gray-800 dark:text-white"
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light (1-3 days/wk)</option>
                  <option value="moderate">Moderate (3-5 days/wk)</option>
                  <option value="active">Active (6-7 days/wk)</option>
                  <option value="very_active">Very Active (2x/day)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Fitness Goal</label>
                <select
                  value={profile.fitnessGoal || "maintain"}
                  onChange={(e) =>
                    setProfile({ ...profile, fitnessGoal: e.target.value as FitnessGoal })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-[#C9A530] focus:border-transparent dark:bg-gray-800 dark:text-white"
                >
                  <option value="lose_weight">Lose Weight</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain_muscle">Gain Muscle</option>
                  <option value="gain_weight">Gain Weight</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Dietary Restrictions
            </h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {[
                { key: "isVegetarian", label: "Vegetarian" },
                { key: "isVegan", label: "Vegan" },
                { key: "isGlutenFree", label: "Gluten-Free" },
                { key: "isKosher", label: "Kosher" },
                { key: "isDairyFree", label: "Dairy-Free" },
                { key: "isNutFree", label: "Nut-Free" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={(profile[key as keyof UserProfile] as boolean) || false}
                    onChange={(e) =>
                      setProfile({ ...profile, [key]: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 dark:text-[#C9A530] border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:focus:ring-[#C9A530]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Likes */}
          <div>
            <h3 className="text-xs font-semibold text-green-600 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              Likes
            </h3>
            <div className="flex gap-2 mb-2">
              <input
                ref={likeInputRef}
                type="text"
                value={likeInput}
                onChange={(e) => setLikeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLike()}
                placeholder="e.g. Chicken, Rice..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={handleAddLike}
                disabled={!likeInput.trim()}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {likes.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium border border-green-200"
                >
                  {item}
                  <button
                    onClick={() => onRemovePreference(item, "like")}
                    className="text-green-600 hover:text-green-900 ml-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              {likes.length === 0 && (
                <span className="text-xs text-gray-400 italic">No likes added yet</span>
              )}
            </div>
          </div>

          {/* Dislikes */}
          <div>
            <h3 className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-6h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
              Dislikes
            </h3>
            <div className="flex gap-2 mb-2">
              <input
                ref={dislikeInputRef}
                type="text"
                value={dislikeInput}
                onChange={(e) => setDislikeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddDislike()}
                placeholder="e.g. Cucumber, Tofu..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                onClick={handleAddDislike}
                disabled={!dislikeInput.trim()}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dislikes.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium border border-red-200"
                >
                  {item}
                  <button
                    onClick={() => onRemovePreference(item, "dislike")}
                    className="text-red-600 hover:text-red-900 ml-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              {dislikes.length === 0 && (
                <span className="text-xs text-gray-400 italic">No dislikes added yet</span>
              )}
            </div>
          </div>

          {/* Daily Targets */}
          {profile.targetCalories && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Daily Targets
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-purple-50 dark:bg-gray-800 rounded-lg px-2 py-2 text-center">
                  <div className="text-sm font-bold text-purple-700 dark:text-[#C9A530]">{profile.targetCalories}</div>
                  <div className="text-[10px] text-purple-600 dark:text-[#C9A530]">Cal</div>
                </div>
                <div className="bg-blue-50 dark:bg-gray-800 rounded-lg px-2 py-2 text-center">
                  <div className="text-sm font-bold text-blue-700 dark:text-[#C9A530]">{profile.targetProtein}g</div>
                  <div className="text-[10px] text-blue-600 dark:text-[#C9A530]">Protein</div>
                </div>
                <div className="bg-green-50 dark:bg-gray-800 rounded-lg px-2 py-2 text-center">
                  <div className="text-sm font-bold text-green-700 dark:text-[#C9A530]">{profile.targetCarbs}g</div>
                  <div className="text-[10px] text-green-600 dark:text-[#C9A530]">Carbs</div>
                </div>
                <div className="bg-orange-50 dark:bg-gray-800 rounded-lg px-2 py-2 text-center">
                  <div className="text-sm font-bold text-orange-700 dark:text-[#C9A530]">{profile.targetFat}g</div>
                  <div className="text-[10px] text-orange-600 dark:text-[#C9A530]">Fat</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="px-5 py-4 border-t border-purple-200 dark:border-gray-700 bg-purple-50 dark:bg-gray-800 flex-shrink-0">
          <button
            onClick={handleSave}
            className="w-full px-4 py-2.5 bg-purple-600 dark:bg-gradient-to-r dark:from-[#C9A530] dark:via-[#EDD96A] dark:to-[#B8943A] text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:bg-purple-700 dark:hover:from-[#A88928] dark:hover:via-[#D4BC50] dark:hover:to-[#9A7820] transition-all shadow-md hover:shadow-lg"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export { UserProfileCard as UserProfileModal };
