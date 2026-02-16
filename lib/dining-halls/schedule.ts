/**
 * Dining hall schedules and operating hours
 */

export type MealPeriod = "breakfast" | "lunch" | "dinner";

export interface MealTime {
  start: string; // 24-hour format "HH:MM"
  end: string;
}

export interface DiningHallSchedule {
  name: string;
  meals: {
    breakfast?: MealTime;
    lunch: MealTime;
    dinner: MealTime;
  };
}

/**
 * Dining hall schedules
 * Note: "open" and "close" times vary by hall, using typical hours
 */
export const DINING_HALL_SCHEDULES: Record<string, DiningHallSchedule> = {
  "Allison Dining Commons": {
    name: "Allison Dining Commons",
    meals: {
      breakfast: { start: "07:00", end: "11:00" },
      lunch: { start: "11:00", end: "17:00" },
      dinner: { start: "17:00", end: "20:00" },
    },
  },
  "Sargent Dining Commons": {
    name: "Sargent Dining Commons",
    meals: {
      breakfast: { start: "07:00", end: "11:00" },
      lunch: { start: "11:00", end: "17:00" },
      dinner: { start: "17:00", end: "20:00" },
    },
  },
  "Foster Walker Plex East": {
    name: "Foster Walker Plex East",
    meals: {
      breakfast: { start: "07:00", end: "11:00" },
      lunch: { start: "11:00", end: "17:00" },
      dinner: { start: "17:00", end: "22:00" },
    },
  },
  "Foster Walker Plex West": {
    name: "Foster Walker Plex West",
    meals: {
      // No breakfast at Plex West
      lunch: { start: "11:00", end: "14:00" },
      dinner: { start: "17:00", end: "20:00" },
    },
  },
  "Elder Dining Commons": {
    name: "Elder Dining Commons",
    meals: {
      breakfast: { start: "07:00", end: "11:00" },
      lunch: { start: "11:00", end: "17:00" },
      dinner: { start: "17:00", end: "22:00" },
    },
  },
};

/**
 * Get the meal period for a given date and time
 */
export function getCurrentMealPeriod(
  diningHall: string,
  date: Date = new Date()
): MealPeriod | null {
  const schedule = DINING_HALL_SCHEDULES[diningHall];
  if (!schedule) return null;

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentTime = hours * 60 + minutes;

  // Check each meal period
  for (const [period, time] of Object.entries(schedule.meals)) {
    if (!time) continue;

    const [startHour, startMin] = time.start.split(":").map(Number);
    const [endHour, endMin] = time.end.split(":").map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (currentTime >= startTime && currentTime < endTime) {
      return period as MealPeriod;
    }
  }

  return null;
}

/**
 * Check if a dining hall is currently open
 */
export function isDiningHallOpen(
  diningHall: string,
  date: Date = new Date()
): boolean {
  return getCurrentMealPeriod(diningHall, date) !== null;
}

/**
 * Get all dining halls that are currently serving a specific meal
 */
export function getOpenDiningHalls(
  mealPeriod?: MealPeriod,
  date: Date = new Date()
): string[] {
  return Object.keys(DINING_HALL_SCHEDULES).filter((hall) => {
    const currentPeriod = getCurrentMealPeriod(hall, date);
    if (mealPeriod) {
      return currentPeriod === mealPeriod;
    }
    return currentPeriod !== null;
  });
}

/**
 * Format meal time for display
 */
export function formatMealTime(time: MealTime): string {
  const formatHour = (timeStr: string) => {
    const [hour, min] = timeStr.split(":").map(Number);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${min.toString().padStart(2, "0")}${ampm}`;
  };

  return `${formatHour(time.start)} - ${formatHour(time.end)}`;
}
