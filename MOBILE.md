# Mobile Responsiveness Guide

Steps to make the app usable on phones. All changes use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) — no new CSS needed.

---

## 1. `app/menu/page.tsx` — Heading font size

The `text-5xl` title overflows on narrow screens.

```diff
- <h1 className="text-5xl font-bold ...">
+ <h1 className="text-3xl sm:text-5xl font-bold ...">
```

---

## 2. `app/menu/menu-explorer.tsx` — Filter bar

### Top row (date / time / search / profile button)
Currently all items sit in a single `flex flex-wrap` row. On mobile they cram together.

- Change the row to `flex flex-col sm:flex-row` so inputs stack vertically on mobile.
- Change search input from `min-w-[200px]` to `w-full sm:min-w-[200px]` so it fills the width on mobile instead of overflowing.

```diff
- <div className="flex flex-wrap items-center gap-3 mb-3">
+ <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 mb-3">

- className="flex-1 min-w-[200px] px-4 py-2 ..."
+ className="flex-1 w-full sm:min-w-[200px] px-4 py-2 ..."
```

### Second row (dietary filter buttons)
Six emoji buttons in a row overflow on small screens. Wrap them in a horizontally scrollable container instead of letting them wrap to multiple lines.

```diff
- <div className="flex flex-wrap items-center gap-2">
+ <div className="flex items-center gap-2 overflow-x-auto pb-1">
```

Add `flex-shrink-0` to each filter button so they don't compress when scrolling.

### Dining hall section headers
`px-8 py-6` is too much padding on mobile.

```diff
- <div className={`px-8 py-6 ...`}>
+ <div className={`px-4 py-4 sm:px-8 sm:py-6 ...`}>
```

---

## 3. `app/menu/components/tab-navigation.tsx` — Tab labels

Three tabs with long labels (`🍽️ Explore Menu`, `✨ AI Recommendations`, `📊 Today's Meals`) overflow on screens narrower than ~420px.

- Shrink padding: `px-6 py-2.5` → `px-3 py-2 sm:px-6 sm:py-2.5`
- Show short labels on mobile using `hidden sm:inline`:

```jsx
// Replace each tab's label with two spans:
<>
  <span>🍽️</span>
  <span className="hidden sm:inline"> Explore Menu</span>
</>

<>
  <span>✨</span>
  <span className="hidden sm:inline"> AI Recommendations</span>
</>

<>
  <span>📊</span>
  <span className="hidden sm:inline"> Today's Meals</span>
</>
```

---

## 4. `app/menu/components/recommendations-tab.tsx` — Padding & button layout

- Container: `p-6` → `p-3 sm:p-6`
- Header card: `p-6` → `p-3 sm:p-6`
- The "Generate Recommendations" button sits to the right of the heading in a `flex justify-between` row. On mobile these two elements need to stack:

```diff
- <div className="flex items-center justify-between mb-4">
+ <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
```

- Card header: `px-6 py-4` → `px-4 py-3 sm:px-6 sm:py-4`
- Card body: `p-6` → `p-4 sm:p-6`

---

## 5. `app/menu/components/recommendation-card.tsx` — Nutrition grid

The 4-column nutrition grid (`grid-cols-4`) is cramped on phones — each cell is ~80px wide with labels and numbers.

```diff
- <div className="grid grid-cols-4 gap-2 mb-4">
+ <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
```

Also remove `hover:scale-105` from the "Add to Today" button — scale transforms on touch cause a layout shift flash.

---

## 6. `app/menu/components/todays-meals-tab.tsx` — Padding

- Container: `p-6` → `p-3 sm:p-6`
- Inner card: `p-6` → `p-4 sm:p-6`

---

## 7. `app/menu/components/macro-dashboard.tsx` — Macro grid

On mobile, `grid-cols-1` makes each of the 5 macro cards full-width — the dashboard becomes very tall. Show 2 per row instead:

```diff
- <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
+ <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
```

---

## 8. `app/menu/user-profile-modal.tsx` — Modal sizing & positioning

This is the most critical fix. The modal is `fixed top-20 right-4 w-[380px]`. On phones narrower than ~400px (iPhone SE is 375px), it overflows off the right edge.

Change the container to be centered and full-width on mobile, right-anchored on sm+:

```diff
- <div className="fixed top-20 right-4 w-[380px] z-40 max-h-[calc(100vh-6rem)]">
+ <div className="fixed top-16 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4
+                 w-[calc(100vw-2rem)] max-w-[380px] z-40 max-h-[calc(100vh-5rem)]">
```

Also fix the cramped input grids inside the modal:

```diff
# Physical Attributes (Age/Gender/Height/Weight)
- <div className="grid grid-cols-2 gap-3">
+ <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

# Daily Targets (Cal/Protein/Carbs/Fat)
- <div className="grid grid-cols-4 gap-2">
+ <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
```

---

## 9. `app/menu/components/tracked-meal-card.tsx` — Nutrition row overflow

The 5 nutrition values (Cals, P, C, F, S) sit in a single `flex` row. On very narrow screens they overflow.

```diff
- <div className="flex gap-3 text-sm">
+ <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
```

---

## Testing

After making changes:

1. Run `npm run dev`
2. Open Chrome DevTools (F12) → click the device toolbar icon (Ctrl+Shift+M)
3. Test at **iPhone SE** (375×667) and **iPhone 14** (390×844)
4. Walk through all 3 tabs: Explore Menu, AI Recommendations, Today's Meals
5. Open the Profile modal and verify it fits on screen
6. Scroll the dietary filter row horizontally
7. Check the macro dashboard in Today's Meals
