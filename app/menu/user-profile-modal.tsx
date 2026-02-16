"use client";

import { useState } from "react";
import {
  UserProfile,
  FitnessGoal,
  ActivityLevel,
  Gender,
  calculateTDEE,
  calculateMacros,
} from "@/lib/types/user-profile";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

export function UserProfileModal({
  isOpen,
  onClose,
  onSave,
  initialProfile,
}: UserProfileModalProps) {
  // Initialize all fields to prevent controlled/uncontrolled input errors
  const [profile, setProfile] = useState<UserProfile>({
    activityLevel: "moderate",
    fitnessGoal: "maintain",
    age: undefined,
    gender: undefined,
    height: undefined,
    weight: undefined,
    ...initialProfile,
  });

  if (!isOpen) return null;

  const handleSave = () => {
    // Auto-calculate macros if we have enough info
    if (profile.weight && profile.height && profile.age && profile.gender) {
      const tdee = calculateTDEE(profile);
      if (tdee && profile.fitnessGoal) {
        const calories = tdee;
        const macros = calculateMacros(calories, profile.fitnessGoal, profile.weight);

        const updatedProfile = {
          ...profile,
          targetCalories: calories,
          targetProtein: macros.protein,
          targetCarbs: macros.carbs,
          targetFat: macros.fat,
        };

        onSave(updatedProfile);
        onClose();
        return;
      }
    }

    onSave(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 rounded-3xl max-w-2xl w-full my-8 flex flex-col max-h-[calc(100vh-4rem)] shadow-2xl border-2 border-purple-200">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-3xl flex-shrink-0">
          <h2 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Your Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">

          {/* Physical Attributes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Physical Attributes
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={profile.age ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, age: val ? parseInt(val) : undefined });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={profile.gender ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, gender: val ? (val as Gender) : undefined });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (inches)
                </label>
                <input
                  type="number"
                  value={profile.height ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, height: val ? parseInt(val) : undefined });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  value={profile.weight ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, weight: val ? parseInt(val) : undefined });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="180"
                />
              </div>
            </div>
          </div>

          {/* Goals */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Goals</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Level
                </label>
                <select
                  value={profile.activityLevel || "moderate"}
                  onChange={(e) =>
                    setProfile({ ...profile, activityLevel: e.target.value as ActivityLevel })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="sedentary">Sedentary (little/no exercise)</option>
                  <option value="light">Light (1-3 days/week)</option>
                  <option value="moderate">Moderate (3-5 days/week)</option>
                  <option value="active">Active (6-7 days/week)</option>
                  <option value="very_active">Very Active (2x/day)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fitness Goal
                </label>
                <select
                  value={profile.fitnessGoal || "maintain"}
                  onChange={(e) =>
                    setProfile({ ...profile, fitnessGoal: e.target.value as FitnessGoal })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Dietary Restrictions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "isVegetarian", label: "Vegetarian" },
                { key: "isVegan", label: "Vegan" },
                { key: "isGlutenFree", label: "Gluten-Free" },
                { key: "isKosher", label: "Kosher" },
                { key: "isDairyFree", label: "Dairy-Free" },
                { key: "isNutFree", label: "Nut-Free" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(profile[key as keyof UserProfile] as boolean) || false}
                    onChange={(e) =>
                      setProfile({ ...profile, [key]: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="flex gap-3 p-6 border-t-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-b-3xl flex-shrink-0">
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white rounded-2xl font-bold hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            💾 Save Profile
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-2xl font-bold hover:from-gray-300 hover:to-gray-400 transition-all shadow-md hover:shadow-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
