import { ZenRows } from "zenrows";

export interface ScrapedMenuItem {
  name: string;
  station?: string;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  dietaryTags?: {
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    isKosher?: boolean;
    isDairyFree?: boolean;
    isNutFree?: boolean;
  };
  servingSize?: string;
  ingredients?: string;
  allergens?: string[];
}

export interface DiningHallMenu {
  diningHall: string;
  locationId: string;
  mealPeriod: "breakfast" | "lunch" | "dinner";
  date: Date;
  items: ScrapedMenuItem[];
}

/**
 * API Configuration
 */
const API_BASE_URL = "https://apiv4.dineoncampus.com";
const NORTHWESTERN_SITE_ID = "5acea5d8f3eeb60b08c5a50d";

/**
 * Initialize ZenRows client
 */
const getZenRowsClient = () => {
  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) {
    throw new Error("ZENROWS_API_KEY environment variable is not set");
  }
  return new ZenRows(apiKey);
};

/**
 * Helper to make API calls through ZenRows
 */
async function fetchWithZenRows<T>(url: string): Promise<T> {
  const client = getZenRowsClient();

  const response = await client.get(url, {
    mode: "auto", // Auto mode - ZenRows decides best approach
    autoparse: true, // Auto-parse the response
  });

  const text = await response.text();
  return JSON.parse(text) as T;
}

/**
 * API Response Types
 */
interface LocationResponse {
  id: string;
  name: string;
  address1?: string;
  menu_type?: string;
  menu_html?: string;
}

interface BuildingsResponse {
  buildings: Array<{
    buildingId: string;
    buildingName: string;
    locations: LocationResponse[];
  }>;
}

interface PeriodResponse {
  id: string;
  name: string;
  sort_order?: number;
}

interface NutrientResponse {
  name: string;
  value: string;
  uom: string;
  valueNumeric: string;
}

interface FilterResponse {
  id: string;
  name: string;
  icon: boolean;
}

interface MenuItemResponse {
  name: string;
  desc?: string;
  portion?: string;
  ingredients?: string;
  calories?: number;
  nutrients?: NutrientResponse[];
  filters?: FilterResponse[];
  customAllergens?: string[];
}

interface MenuCategoryResponse {
  name: string;
  items: MenuItemResponse[];
}

interface MenuResponse {
  period: {
    id: string;
    name: string;
    categories: MenuCategoryResponse[];
  };
}

/**
 * Fetches all location IDs for Northwestern
 */
export async function getLocations(): Promise<LocationResponse[]> {
  const url = `${API_BASE_URL}/sites/${NORTHWESTERN_SITE_ID}/locations-public?for_menus=true`;
  const data = await fetchWithZenRows<BuildingsResponse>(url);

  // Flatten locations from all buildings into a single array
  const locations: LocationResponse[] = [];
  for (const building of data.buildings) {
    locations.push(...building.locations);
  }

  return locations;
}

/**
 * Fetches period IDs for a given location and date
 */
export async function getPeriods(locationId: string, date: Date): Promise<PeriodResponse[]> {
  const dateStr = date.toISOString().split("T")[0];
  const url = `${API_BASE_URL}/locations/${locationId}/periods/?date=${dateStr}`;
  const data = await fetchWithZenRows<any>(url);

  // Debug: log the response structure
  console.log("Periods response:", JSON.stringify(data, null, 2));

  // Handle if data is an object with periods property or direct array
  if (Array.isArray(data)) {
    return data;
  } else if (data.periods && Array.isArray(data.periods)) {
    return data.periods;
  } else {
    console.warn("Unexpected periods response format:", data);
    return [];
  }
}

/**
 * Finds a period ID by name (breakfast, lunch, dinner)
 */
export function findPeriodByName(
  periods: PeriodResponse[],
  mealPeriod: "breakfast" | "lunch" | "dinner"
): PeriodResponse | undefined {
  const periodName = mealPeriod.toLowerCase();
  return periods.find((p) => p.name.toLowerCase().includes(periodName));
}

/**
 * Gets nutrition value from nutrients array by name
 */
function getNutrientValue(nutrients: NutrientResponse[] | undefined, name: string): number | undefined {
  if (!nutrients) return undefined;
  const nutrient = nutrients.find((n) => n.name.toLowerCase().includes(name.toLowerCase()));
  if (!nutrient) return undefined;
  const parsed = parseInt(nutrient.valueNumeric);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Checks if item has a specific dietary filter
 */
function hasDietaryFilter(item: MenuItemResponse, filterName: string): boolean {
  return (
    item.filters?.some((filter) => filter.name.toLowerCase().includes(filterName.toLowerCase())) ??
    false
  );
}

/**
 * Converts API menu item to our ScrapedMenuItem format
 */
function convertMenuItem(apiItem: MenuItemResponse, station?: string): ScrapedMenuItem {
  return {
    name: apiItem.name,
    station,
    nutrition: {
      calories: apiItem.calories,
      protein: getNutrientValue(apiItem.nutrients, "protein"),
      carbs: getNutrientValue(apiItem.nutrients, "carbohydrate"),
      fat: getNutrientValue(apiItem.nutrients, "total fat"),
      fiber: getNutrientValue(apiItem.nutrients, "fiber"),
      sugar: getNutrientValue(apiItem.nutrients, "sugar"),
      sodium: getNutrientValue(apiItem.nutrients, "sodium"),
    },
    dietaryTags: {
      isVegetarian: hasDietaryFilter(apiItem, "vegetarian"),
      isVegan: hasDietaryFilter(apiItem, "vegan"),
      isGlutenFree: hasDietaryFilter(apiItem, "gluten"),
      isKosher: hasDietaryFilter(apiItem, "kosher"),
      isDairyFree: hasDietaryFilter(apiItem, "dairy"),
      isNutFree: hasDietaryFilter(apiItem, "nut"),
    },
    servingSize: apiItem.portion,
    ingredients: apiItem.ingredients,
    allergens: apiItem.customAllergens || [],
  };
}

/**
 * Fetches menu for a specific location, period, and date
 */
export async function getMenu(
  locationId: string,
  periodId: string,
  date: Date
): Promise<ScrapedMenuItem[]> {
  const dateStr = date.toISOString().split("T")[0];
  const url = `${API_BASE_URL}/locations/${locationId}/menu?date=${dateStr}&period=${periodId}`;

  const menuData = await fetchWithZenRows<MenuResponse>(url);
  const items: ScrapedMenuItem[] = [];

  // Check if we have period data
  if (!menuData.period || !menuData.period.categories) {
    return items;
  }

  // Extract items from all categories (stations)
  for (const category of menuData.period.categories) {
    for (const item of category.items || []) {
      items.push(convertMenuItem(item, category.name));
    }
  }

  return items;
}

/**
 * Scrapes the menu for a specific location, meal period, and date
 */
export async function scrapeMenuByLocationId(
  locationId: string,
  locationName: string,
  mealPeriod: "breakfast" | "lunch" | "dinner",
  date: Date = new Date()
): Promise<DiningHallMenu> {
  try {
    // Get periods for this location and date
    const periods = await getPeriods(locationId, date);

    // Find the specific period we want
    const period = findPeriodByName(periods, mealPeriod);
    if (!period) {
      console.warn(`No ${mealPeriod} period found for location ${locationName} on ${date}`);
      return {
        diningHall: locationName,
        locationId,
        mealPeriod,
        date,
        items: [],
      };
    }

    // Get menu items for this period
    const items = await getMenu(locationId, period.id, date);

    return {
      diningHall: locationName,
      locationId,
      mealPeriod,
      date,
      items,
    };
  } catch (error) {
    console.error(`Error scraping menu for ${locationName} (${locationId}):`, error);
    throw error;
  }
}

/**
 * Scrapes all dining halls for a specific meal period and date
 */
export async function scrapeAllDiningHalls(
  mealPeriod: "breakfast" | "lunch" | "dinner",
  date: Date = new Date()
): Promise<DiningHallMenu[]> {
  try {
    // Get all locations
    const locations = await getLocations();

    // Scrape menu for each location
    const results = await Promise.allSettled(
      locations.map((location) =>
        scrapeMenuByLocationId(location.id, location.name, mealPeriod, date)
      )
    );

    return results
      .filter(
        (result): result is PromiseFulfilledResult<DiningHallMenu> => result.status === "fulfilled"
      )
      .map((result) => result.value);
  } catch (error) {
    console.error("Error scraping all dining halls:", error);
    throw error;
  }
}
