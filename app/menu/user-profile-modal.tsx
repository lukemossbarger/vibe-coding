"use client";

import { useState, useEffect } from "react";
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
}

export function UserProfileCard({
  isOpen,
  onClose,
  onSave,
  initialProfile,
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

  if (!isOpen) return null;

  return (
    <div className="fixed top-24 right-4 w-[300px] z-40">
      <div className="bg-gradient-to-b from-white via-purple-50/30 to-blue-50/30 rounded-2xl border-2 border-purple-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <h2 className="text-lg font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
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

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Physical Attributes */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Physical Attributes
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">Age</label>
                <input
                  type="number"
                  value={profile.age ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, age: val ? parseInt(val) : undefined });
                  }}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">Gender</label>
                <select
                  value={profile.gender ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, gender: val ? (val as Gender) : undefined });
                  }}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">Height (in)</label>
                <input
                  type="number"
                  value={profile.height ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, height: val ? parseInt(val) : undefined });
                  }}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">Weight (lbs)</label>
                <input
                  type="number"
                  value={profile.weight ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, weight: val ? parseInt(val) : undefined });
                  }}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="180"
                />
              </div>
            </div>
          </div>

          {/* Goals */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Goals</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">Activity Level</label>
                <select
                  value={profile.activityLevel || "moderate"}
                  onChange={(e) =>
                    setProfile({ ...profile, activityLevel: e.target.value as ActivityLevel })
                  }
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light (1-3 days/wk)</option>
                  <option value="moderate">Moderate (3-5 days/wk)</option>
                  <option value="active">Active (6-7 days/wk)</option>
                  <option value="very_active">Very Active (2x/day)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">Fitness Goal</label>
                <select
                  value={profile.fitnessGoal || "maintain"}
                  onChange={(e) =>
                    setProfile({ ...profile, fitnessGoal: e.target.value as FitnessGoal })
                  }
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Dietary Restrictions
            </h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {[
                { key: "isVegetarian", label: "Vegetarian" },
                { key: "isVegan", label: "Vegan" },
                { key: "isGlutenFree", label: "Gluten-Free" },
                { key: "isKosher", label: "Kosher" },
                { key: "isDairyFree", label: "Dairy-Free" },
                { key: "isNutFree", label: "Nut-Free" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={(profile[key as keyof UserProfile] as boolean) || false}
                    onChange={(e) =>
                      setProfile({ ...profile, [key]: e.target.checked })
                    }
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-xs text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Daily Targets */}
          {profile.targetCalories && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                Daily Targets
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-purple-50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-base font-bold text-purple-700">{profile.targetCalories}</div>
                  <div className="text-[10px] text-purple-600">Calories</div>
                </div>
                <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-base font-bold text-blue-700">{profile.targetProtein}g</div>
                  <div className="text-[10px] text-blue-600">Protein</div>
                </div>
                <div className="bg-green-50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-base font-bold text-green-700">{profile.targetCarbs}g</div>
                  <div className="text-[10px] text-green-600">Carbs</div>
                </div>
                <div className="bg-orange-50 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-base font-bold text-orange-700">{profile.targetFat}g</div>
                  <div className="text-[10px] text-orange-600">Fat</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="px-4 pb-4">
          <button
            onClick={handleSave}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export { UserProfileCard as UserProfileModal };
