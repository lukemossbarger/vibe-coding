-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name VARCHAR(255) NOT NULL,
  dining_hall VARCHAR(100) NOT NULL,
  meal_period VARCHAR(20) NOT NULL,
  date TIMESTAMP NOT NULL,

  -- Nutrition data
  calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fat INTEGER,
  fiber INTEGER,
  sugar INTEGER,
  sodium INTEGER,

  -- Dietary tags
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_vegan BOOLEAN DEFAULT FALSE,
  is_gluten_free BOOLEAN DEFAULT FALSE,
  is_kosher BOOLEAN DEFAULT FALSE,
  is_dairy_free BOOLEAN DEFAULT FALSE,
  is_nut_free BOOLEAN DEFAULT FALSE,

  -- Additional info
  serving_size VARCHAR(100),
  ingredients TEXT,
  allergens TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Prevent duplicates
  UNIQUE(name, dining_hall, meal_period, date)
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User info
  user_id VARCHAR(255) UNIQUE NOT NULL,

  -- Physical attributes
  height INTEGER,
  weight INTEGER,
  gender VARCHAR(20),

  -- Nutrition goals
  target_calories INTEGER,
  target_protein INTEGER,
  target_carbs INTEGER,
  target_fat INTEGER,

  -- Dietary restrictions
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_vegan BOOLEAN DEFAULT FALSE,
  is_gluten_free BOOLEAN DEFAULT FALSE,
  is_kosher BOOLEAN DEFAULT FALSE,
  is_dairy_free BOOLEAN DEFAULT FALSE,
  is_nut_free BOOLEAN DEFAULT FALSE,

  -- Preferences
  preferred_dining_halls TEXT,
  disliked_ingredients TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_menu_items_dining_hall ON menu_items(dining_hall);
CREATE INDEX IF NOT EXISTS idx_menu_items_date ON menu_items(date);
CREATE INDEX IF NOT EXISTS idx_menu_items_meal_period ON menu_items(meal_period);
CREATE INDEX IF NOT EXISTS idx_menu_items_dietary ON menu_items(is_vegetarian, is_vegan, is_gluten_free);
