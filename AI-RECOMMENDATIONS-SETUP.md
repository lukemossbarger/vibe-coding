# AI Meal Recommendations Setup Guide

## What's Been Built

A complete AI-powered meal recommendation system that:

1. **User Profile System**
   - Collects user data (height, weight, age, gender)
   - Tracks fitness goals (lose weight, gain muscle, maintain, etc.)
   - Records dietary restrictions (vegetarian, vegan, kosher, etc.)
   - Auto-calculates daily calorie needs and macro targets

2. **AI Recommendation Engine**
   - Primary: Claude 3.5 Sonnet (Anthropic)
   - Fallback: GPT-4 (OpenAI)
   - Analyzes user profile + available menu items
   - Provides personalized meal suggestions with nutritional reasoning

3. **Smart Integration**
   - Only recommends from currently available/open dining halls
   - Respects user's dietary restrictions
   - Considers macro and calorie targets
   - Provides 3-5 specific meal recommendations with explanations

## Setup Instructions

### 1. Get an Anthropic API Key (Recommended)

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to "API Keys"
4. Create a new key
5. Copy the key (starts with `sk-ant-...`)

### 2. Add to Environment Variables

Open your `.env` file and add:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**OR** if using OpenAI instead:

```bash
OPENAI_API_KEY=sk-your-openai-key-here
```

### 3. Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## How to Use

1. **Visit** http://localhost:3000/menu

2. **Set Up Your Profile**
   - Click "Set Up Profile" button (top right)
   - Enter your physical stats (height, weight, age, gender)
   - Select your fitness goal
   - Mark any dietary restrictions
   - Save

3. **Filter Menu Items**
   - Select date and time
   - Choose dining hall (or "all")
   - Select meal period (or "all")
   - Enable/disable "Show only open dining halls"

4. **Get AI Recommendations**
   - Once you have menu items showing, click "Get Recommendations"
   - Claude will analyze your profile and suggest 3-5 optimal meals
   - Each recommendation includes:
     - Why it's good for your goals
     - Nutritional highlights
     - Portion suggestions
     - Meal timing advice

## Features

- ✅ Automatic TDEE (Total Daily Energy Expenditure) calculation
- ✅ Smart macro distribution based on fitness goal
- ✅ Real-time filtering by dining hall hours
- ✅ Dietary restriction compliance
- ✅ Personalized meal combinations
- ✅ Nutritional reasoning for each suggestion

## API Costs

**Anthropic Claude:**
- ~$0.003 per recommendation (Claude 3.5 Sonnet)
- 1000 recommendations ≈ $3

**OpenAI GPT-4:**
- ~$0.01-0.03 per recommendation
- More expensive than Claude for this use case

**Recommendation:** Use Claude for better nutrition-focused responses at lower cost.

## Troubleshooting

**Error: "No LLM API configured"**
- Make sure you've added `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to your `.env`
- Restart the dev server after adding the key

**Error: "No menu items available"**
- Adjust your date/time filters
- Disable "Show only open dining halls" to see all items
- Check that you have data in your database

**Recommendations seem generic**
- Make sure you've filled out your profile completely
- Include height, weight, age, gender for best results
- Set a specific fitness goal

## Next Steps

Potential enhancements:
- Save user profile to database
- Track meals eaten over time
- Calculate daily nutrition progress
- Meal prep suggestions for the week
- Export meal plans to calendar
