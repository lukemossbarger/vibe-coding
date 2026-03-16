/**
 * Dining hall schedules and operating hours
 */

export type MealPeriod = "breakfast" | "lunch" | "dinner";

export interface MealTime {
  start: string; // 24-hour format "HH:MM"
  end: string;
}

export interface DaySchedule {
  breakfast?: MealTime;
  lunch?: MealTime;
  dinner?: MealTime;
}

export interface DiningHallSchedule {
  name: string;
  /** Default schedule (used when no day-specific override exists) */
  meals: DaySchedule;
  /** Day-of-week overrides: 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
  byDay?: Partial<Record<number, DaySchedule>>;
}

export const DINING_HALL_SCHEDULES: Record<string, DiningHallSchedule> = {
  "Allison Dining Commons": {
    name: "Allison Dining Commons",
    // 7:00a – 8:00p every day
    meals: {
      breakfast: { start: "07:00", end: "11:00" },
      lunch:     { start: "11:00", end: "17:00" },
      dinner:    { start: "17:00", end: "20:00" },
    },
  },

  "Sargent Dining Commons": {
    name: "Sargent Dining Commons",
    // 7:00a – 8:00p every day
    meals: {
      breakfast: { start: "07:00", end: "11:00" },
      lunch:     { start: "11:00", end: "17:00" },
      dinner:    { start: "17:00", end: "20:00" },
    },
  },

  "Foster Walker Plex East": {
    name: "Foster Walker Plex East",
    // Mon–Thu default: 7:00a – 10:00p
    meals: {
      breakfast: { start: "07:00", end: "11:00" },
      lunch:     { start: "11:00", end: "17:00" },
      dinner:    { start: "17:00", end: "22:00" },
    },
    byDay: {
      // Friday: 7:00a – 8:00p
      5: {
        breakfast: { start: "07:00", end: "11:00" },
        lunch:     { start: "11:00", end: "17:00" },
        dinner:    { start: "17:00", end: "20:00" },
      },
      // Saturday: 10:00a – 8:00p (no breakfast)
      6: {
        lunch:  { start: "10:00", end: "17:00" },
        dinner: { start: "17:00", end: "20:00" },
      },
      // Sunday: 10:00a – 8:00p (no breakfast)
      0: {
        lunch:  { start: "10:00", end: "17:00" },
        dinner: { start: "17:00", end: "20:00" },
      },
    },
  },

  "Foster Walker Plex West": {
    name: "Foster Walker Plex West",
    // Every day: 11:00a – 2:00p, 5:00p – 8:00p (no breakfast)
    meals: {
      lunch:  { start: "11:00", end: "14:00" },
      dinner: { start: "17:00", end: "20:00" },
    },
  },

  "Elder Dining Commons": {
    name: "Elder Dining Commons",
    // Mon–Thu default: 7:00a – 10:00p
    meals: {
      breakfast: { start: "07:00", end: "11:00" },
      lunch:     { start: "11:00", end: "17:00" },
      dinner:    { start: "17:00", end: "22:00" },
    },
    byDay: {
      // Friday: 7:00a – 8:00p
      5: {
        breakfast: { start: "07:00", end: "11:00" },
        lunch:     { start: "11:00", end: "17:00" },
        dinner:    { start: "17:00", end: "20:00" },
      },
      // Saturday: 10:00a – 8:00p (no breakfast)
      6: {
        lunch:  { start: "10:00", end: "17:00" },
        dinner: { start: "17:00", end: "20:00" },
      },
      // Sunday: 10:00a – 8:00p (no breakfast)
      0: {
        lunch:  { start: "10:00", end: "17:00" },
        dinner: { start: "17:00", end: "20:00" },
      },
    },
  },
};

/**
 * Returns the day-specific meal schedule for a hall, falling back to the default.
 */
function getDaySchedule(schedule: DiningHallSchedule, date: Date): DaySchedule {
  const day = date.getDay(); // 0 = Sunday
  return schedule.byDay?.[day] ?? schedule.meals;
}

/**
 * Get the current meal period for a dining hall at the given date/time.
 */
export function getCurrentMealPeriod(
  diningHall: string,
  date: Date = new Date()
): MealPeriod | null {
  const schedule = DINING_HALL_SCHEDULES[diningHall];
  if (!schedule) return null;

  const daySchedule = getDaySchedule(schedule, date);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentTime = hours * 60 + minutes;

  for (const [period, time] of Object.entries(daySchedule)) {
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
 * Check if a dining hall is currently open.
 */
export function isDiningHallOpen(
  diningHall: string,
  date: Date = new Date()
): boolean {
  return getCurrentMealPeriod(diningHall, date) !== null;
}

/**
 * Get all dining halls currently serving a specific meal (or any meal).
 */
export function getOpenDiningHalls(
  mealPeriod?: MealPeriod,
  date: Date = new Date()
): string[] {
  return Object.keys(DINING_HALL_SCHEDULES).filter((hall) => {
    const currentPeriod = getCurrentMealPeriod(hall, date);
    if (mealPeriod) return currentPeriod === mealPeriod;
    return currentPeriod !== null;
  });
}

/**
 * Format a MealTime for display (e.g. "7:00am - 10:00pm").
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
