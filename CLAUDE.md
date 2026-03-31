# CLAUDE.md — Sublet Search App
## "Available Sublets – No Brokers"

---

## 🏗️ Project Overview

A **React Native + Expo** mobile app for searching and posting sublets across Israel.
No broker fees. Users can search for available sublets by date, location, price, and preferences —
or post their own sublet listing.

**Stack:**
- Frontend: React Native + Expo (SDK 50+)
- Backend/DB: Supabase (Auth, Database, Storage, Realtime)
- Maps: Google Maps API via `react-native-maps` + Google Places API
- Language: Hebrew (RTL layout throughout)
- Navigation: Expo Router (file-based routing)

---

## 📐 RTL & Hebrew — Global Rules

> Every screen is Hebrew, right-to-left. This is non-negotiable.

```js
// In app root / _layout.tsx
import { I18nManager } from 'react-native';
I18nManager.forceRTL(true);
```

- All `flexDirection` defaults behave RTL — text aligns right, icons on the left side of the screen mean they appear on the right visually
- Use `textAlign: 'right'` on all `<Text>` components unless explicitly overridden
- Date format throughout: `DD/MM/YYYY`
- Currency: ₪ (ILS), displayed as `₪X,XXX`

---

## 🗄️ Supabase Schema

Create the following tables. Run these in the Supabase SQL editor.

```sql
-- Users (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Sublet listings
create table sublets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  city text not null,                        -- תל אביב | ירושלים | חיפה | באר שבע | רעננה | הרצליה
  neighborhood text,
  address text,
  lat double precision,
  lng double precision,
  price_per_month integer not null,          -- ILS
  num_rooms numeric(3,1),                    -- 1 | 2 | 3 | 4+
  num_bathrooms numeric(3,1),
  area_sqm integer,
  available_from date not null,
  available_until date not null,
  duration_months integer generated always as
    (extract(month from age(available_until, available_from))::integer) stored,
  num_roommates integer default 0,           -- 0=no roommates
  roommate_gender text default 'לא משנה',   -- רק נשים | רק גברים | מעורב | לא משנה
  apartment_vibe text[],                     -- צעירה ותוססת | שקטה | מתאימה ללמידה/עבודה | שומרי שבת | מסורתית
  amenities text[],                          -- מזגן | מכונת כביסה | מטבח מאובזר | חניה | ריהוט | אינטרנט | מעלית | מרפסת | קרוב לתחבורה ציבורית
  images text[],                             -- Supabase Storage URLs
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Saved/favorited listings
create table saved_sublets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  sublet_id uuid references sublets(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, sublet_id)
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table sublets enable row level security;
alter table saved_sublets enable row level security;

-- RLS Policies
create policy "Public sublets are viewable by everyone"
  on sublets for select using (is_active = true);

create policy "Users can insert their own sublet"
  on sublets for insert with check (auth.uid() = user_id);

create policy "Users can update their own sublet"
  on sublets for update using (auth.uid() = user_id);

create policy "Users manage their own saved"
  on saved_sublets for all using (auth.uid() = user_id);

-- Indexes for performance
create index sublets_city_idx on sublets(city);
create index sublets_dates_idx on sublets(available_from, available_until);
create index sublets_price_idx on sublets(price_per_month);
```

---

## 📁 Folder Structure

```
app/
  _layout.tsx                  # Root layout, RTL setup, Supabase provider
  (tabs)/
    index.tsx                  # Map + Search screen (main screen)
    saved.tsx                  # Saved sublets
    post.tsx                   # Post a sublet (+ Post Sublet button)
    profile.tsx                # User profile
  sublet/
    [id].tsx                   # Sublet detail screen

components/
  map/
    SubletMap.tsx              # Google Maps with markers
    SubletMarker.tsx           # Custom green pin marker
    SubletPopupCard.tsx        # Bottom sheet popup on pin tap (Image 10)
  filters/
    FilterPanel.tsx            # Collapsible filter panel wrapper
    DateRangePicker.tsx        # From/To date pickers (Images 1-2)
    LocationDropdown.tsx       # City selector (Image 3)
    RoomsDropdown.tsx          # Rooms selector 1/2/3/4+ (Image 4)
    RoommatesDropdown.tsx      # Roommates count selector (Image 5)
    PriceRangeSlider.tsx       # Dual-handle price slider (Image 6)
    AmenitiesFilter.tsx        # Toggle chips grid (Image 6)
    RoommateGenderDropdown.tsx # Gender preference (Image 7)
    ApartmentVibeFilter.tsx    # Vibe checkboxes (Image 8)
  listing/
    SubletCard.tsx             # Grid/list card view
    SubletDetailSheet.tsx      # Full detail bottom sheet (Images 11-14)
    AmenitiesBadges.tsx        # Green dot badges row (Image 13)
    PublisherContact.tsx       # Publisher info + connect button (Image 14)
  ui/
    AppHeader.tsx              # "Available Sublets – No Brokers" header
    PostSubletFAB.tsx          # Purple FAB "+ Post Sublet" (bottom right)
    DropdownSelect.tsx         # Reusable RTL dropdown component
    PriceLabel.tsx             # ₪X,XXX formatting

lib/
  supabase.ts                  # Supabase client init
  hooks/
    useSublets.ts              # Fetch + filter sublets
    useFilters.ts              # Filter state management
    useSavedSublets.ts         # Save/unsave logic
  utils/
    formatters.ts              # Date, price, duration formatters
    filterHelpers.ts           # Build Supabase query from filter state

constants/
  filters.ts                   # All filter option arrays (cities, amenities, etc.)
```

---

## 🔧 Core Dependencies to Install

```bash
npx expo install react-native-maps
npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
npx expo install @react-native-community/slider
npx expo install react-native-calendars
npx expo install @supabase/supabase-js
npx expo install expo-image-picker
npx expo install expo-location
```

Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      ["react-native-maps", { "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY" }]
    ]
  }
}
```

---

## 🗺️ Screen 1 — Main Map + Search (app/(tabs)/index.tsx)

This is the primary screen. It has two layers:
1. **Google Maps** filling the entire screen with sublet pin markers
2. **Filter panel** overlaid as a scrollable bottom sheet

### Map behavior:
- Initial region: Israel center `{ latitude: 31.5, longitude: 34.8, latitudeDelta: 3, longitudeDelta: 3 }`
- Each sublet is a **green teardrop marker** (custom SVG pin, color `#2ECC71`)
- Tapping a marker opens `SubletPopupCard` as a bottom sheet (see Image 10)
- Bottom-left legend: "מקרא זמינות" with green dot = "פנוי (0-14 ימים)"

### SubletPopupCard (Image 10) contains:
```
Title (bold, RTL)
Neighborhood • City  📍
Short description (2 lines, truncated with ...)
זמין מתאריך: DD/MM/YYYY
משך: X חודשים
₪X,XXX לחודש  (green, bold)
סה"כ לתקופה: ₪XX,XXX | X חודשים
X חדרים · X.X מקלחות · XX מ"ר
[ צפה בפרטים ]  [ שמור להשוואה ]
```

### Filter Panel (collapsible, below map):

**Section: תאריכים** (Images 1-2)
- Header with calendar icon
- Subtext: "בחר תאריכים כדי לראות סאבלטים זמינים"
- Two date inputs: "מתאריך" / "עד תאריך" — DD/MM/YYYY format
- Calendar picker opens inline below input
- Style: blue border card, calendar highlights today in blue filled circle

**Section: פילטרים נוספים** (collapsible, chevron toggle)

Inside פילטרים נוספים:
1. **מיקום** — Dropdown (Image 3): הכל | תל אביב | ירושלים | חיפה | באר שבע | רעננה | הרצליה
2. **חדרים** — Dropdown (Image 4): הכל | 1 | 2 | 3 | 4+
3. **שותפים** — Dropdown (Image 5): הכל | ללא שותפים | שותף אחד | שני שותפים | שלושה שותפים | ארבעה שותפים ומעלה
4. **מחיר** — Dual slider (Image 6): ₪1,000 – ₪9,500, step 500
5. **מתקנים** — Toggle chips grid 2-column RTL (Image 6):
   - Right column: מזגן | מכונת כביסה | מטבח מאובזר | חניה
   - Left column: ריהוט | אינטרנט | מעלית | מרפסת
6. **הרכב השותפים** — Dropdown (Image 7): הכל | רק נשים | רק גברים | מעורב | לא משנה / לא צוין
7. **אופי הדירה** — Checkbox list (Image 8): צעירה ותוססת | שקטה | מתאימה ללמידה / עבודה | שומרי שבת | מסורתית

---

## 🏠 Screen 2 — Sublet Detail (app/sublet/[id].tsx)

Full-screen bottom sheet or modal. Slides up from SubletPopupCard when "צפה בפרטים" is tapped.

### Header (Image 11):
```
✕ button (top left)           Title (centered, bold)
                               [סאבלט] purple badge (top right)
```

### Content sections (Images 11-14):

**Hero image** — full width, 200px height, from Supabase Storage

**Price + Location row:**
```
₪X,XXX לחודש  (green, large)    📍 City – Neighborhood
סה"כ לתקופה: ₪XX,XXX | X חודשים
```

**Stats row:**
```
חדרי שינה: X  🛏  |  מקלחות: X.X  🚿  |  שטח: XX מ"ר  ⬜  |  פנוי מ-: DD/MM/YYYY  📅
```

**תאריכי זמינות card** (Image 12) — blue bordered card:
```
תאריכי זמינות  📅
מתאריך:  [DD/MM/YYYY]  →
עד תאריך: [DD/MM/YYYY]
```
Below: `משך השכרה: X חודשים`

**תיאור section:**
Full description text, RTL

**שירותים ומתקנים section** (Image 13):
Green dot badges in RTL grid:
- מזגן • מכונת כביסה • ריהוט מלא • אינטרנט גבוה • מטבח מאובזר • מרפסת • קרוב לתחבורה ציבורית

**מפרסם section** (Image 14) — yellow/beige card:
```
👤 מפרסם
   [Name]
⚠️  כדי ליצור קשר עם המפרסם, יש להתחבר תחילה
[ התחבר כדי ליצור קשר ]  (black full-width button)
```

---

## ➕ Screen 3 — Post Sublet (app/(tabs)/post.tsx)

Triggered by the purple FAB `+ Post Sublet` button visible on all screens (bottom right, fixed position).

Form fields (all RTL):
- כותרת המודעה (text input)
- עיר (dropdown — same cities list)
- שכונה (text input)
- כתובת מלאה (text input + Google Places Autocomplete)
- מחיר לחודש (number input, ₪)
- מספר חדרים (1 / 2 / 3 / 4+)
- מספר מקלחות
- שטח במ"ר
- תאריך פנוי מ- / עד (date pickers)
- מספר שותפים (dropdown)
- הרכב שותפים (dropdown)
- מתקנים (multi-select chips)
- אופי הדירה (multi-select checkboxes)
- תיאור (multiline textarea)
- תמונות (image picker, up to 10, uploads to Supabase Storage bucket `sublet-images`)

On submit: INSERT into `sublets` table, redirect to listing detail.

---

## 🔍 Filter → Supabase Query Logic (lib/hooks/useSublets.ts)

```typescript
import { supabase } from '../supabase';

interface Filters {
  dateFrom?: string;       // ISO date
  dateTo?: string;
  city?: string;
  rooms?: number | null;
  roommatesCount?: number | null;
  priceMin?: number;
  priceMax?: number;
  amenities?: string[];
  roommateGender?: string;
  vibe?: string[];
}

export async function fetchSublets(filters: Filters) {
  let query = supabase
    .from('sublets')
    .select('*')
    .eq('is_active', true);

  if (filters.city && filters.city !== 'הכל') {
    query = query.eq('city', filters.city);
  }
  if (filters.dateFrom) {
    query = query.lte('available_from', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.gte('available_until', filters.dateTo);
  }
  if (filters.rooms) {
    query = query.eq('num_rooms', filters.rooms);
  }
  if (filters.roommatesCount !== null && filters.roommatesCount !== undefined) {
    query = query.eq('num_roommates', filters.roommatesCount);
  }
  if (filters.priceMin) {
    query = query.gte('price_per_month', filters.priceMin);
  }
  if (filters.priceMax) {
    query = query.lte('price_per_month', filters.priceMax);
  }
  if (filters.roommateGender && filters.roommateGender !== 'הכל') {
    query = query.eq('roommate_gender', filters.roommateGender);
  }
  if (filters.amenities && filters.amenities.length > 0) {
    query = query.contains('amenities', filters.amenities);
  }
  if (filters.vibe && filters.vibe.length > 0) {
    query = query.overlaps('apartment_vibe', filters.vibe);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
```

---

## 🎨 Design Tokens

```typescript
// constants/theme.ts
export const colors = {
  primary: '#7B2FBE',        // Purple — main CTA, badges, FAB
  primaryLight: '#9B59D6',
  success: '#2ECC71',        // Green — map pins, amenity dots, price
  successLight: '#27AE60',
  text: '#1A1A2E',           // Main dark text
  textSecondary: '#666',
  border: '#E0E0E0',
  background: '#F8F8F8',
  cardBg: '#FFFFFF',
  filterCard: '#EEF2FF',     // Light blue card bg for date picker
  warningBg: '#FFF8E7',      // Beige for publisher contact card
  black: '#111111',
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};

export const borderRadius = {
  sm: 8, md: 12, lg: 20, full: 999,
};

export const typography = {
  h1: { fontSize: 22, fontWeight: '700' },
  h2: { fontSize: 18, fontWeight: '700' },
  h3: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  small: { fontSize: 12, fontWeight: '400' },
  price: { fontSize: 20, fontWeight: '700', color: colors.success },
};
```

---

## 🔘 Reusable Component: DropdownSelect

Used by: LocationDropdown, RoomsDropdown, RoommatesDropdown, RoommateGenderDropdown.

```typescript
// Pattern: shows current value, opens inline list below with checkmark on selected
<DropdownSelect
  label="מיקום"
  options={CITIES}
  value={selectedCity}
  onChange={setSelectedCity}
  placeholder="הכל"
/>
```

Style: grey pill background, chevron icon on left side (RTL), selected option shows `✓` checkmark on left, first option is always "הכל" / "All".

---

## 📌 PostSubletFAB (Purple Fixed Button)

```typescript
// Visible on ALL screens, fixed bottom-right
// Position: bottom: 24, right: 16 (visually on right in RTL = left in LTR)
<TouchableOpacity style={styles.fab} onPress={() => router.push('/post')}>
  <Text style={styles.fabText}>+ Post Sublet</Text>
</TouchableOpacity>
```
Style: `backgroundColor: '#7B2FBE'`, borderRadius: 30, paddingHorizontal: 20, paddingVertical: 14.

---

## 🌐 Environment Variables (.env)

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## ✅ Implementation Order (for Claude Code)

Work in this sequence to avoid blockers:

1. **Setup** — Supabase client (`lib/supabase.ts`), env vars, RTL config in root layout
2. **DB Schema** — Run SQL in Supabase dashboard, seed 5-10 mock sublets with Israeli coordinates
3. **Theme** — `constants/theme.ts` with all design tokens
4. **Reusable UI** — `DropdownSelect`, `PriceLabel`, `PostSubletFAB`
5. **Map screen** — `SubletMap` with markers, `SubletPopupCard` bottom sheet
6. **Filter panel** — All filter components, wire to `useFilters` hook
7. **Filter → Query** — `useSublets` hook, connect filters to map markers
8. **Detail screen** — `SubletDetailSheet` with all sections
9. **Post screen** — Form with validation, Supabase insert, image upload
10. **Auth** — Supabase Auth (phone or email), gate "צור קשר" behind login
11. **Saved sublets** — Save/unsave, saved tab screen
12. **Polish** — Loading skeletons, empty states, error handling

---

## ⚠️ Important Notes for Claude Code

- **Always use RTL** — never hardcode `left`/`right` margins without checking RTL behavior
- **Hebrew text only** — all UI strings are in Hebrew as shown in the screenshots
- **Supabase RLS** — always check that policies allow the operation before coding the client call
- **Image handling** — use Supabase Storage bucket `sublet-images`, make bucket public read
- **Bottom sheets** — use `@gorhom/bottom-sheet` for all popup cards and detail views
- **No broker** — the app is explicitly "no brokers"; don't add any commission/fee fields
- **Google Maps** — use `react-native-maps` with `provider={PROVIDER_GOOGLE}`, not Apple Maps
- **Dates** — always store as ISO in DB, display as DD/MM/YYYY in UI
- **Price** — always integer ILS in DB, format with `₪` prefix and thousands separator in UI
