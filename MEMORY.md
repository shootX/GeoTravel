# GeoTravel — პროექტის მეხსიერება

> ეს ფაილი გამოიყენება პროექტის ყველა ცვლილების, განახლების და შენიშვნების ჩასაწერად.
> ყოველი ჩანაწერი უნდა იყოს ქრონოლოგიური — უახლესი ზემოთ.

---

## ჩანაწერის ფორმატი

```markdown
### [YYYY-MM-DD] — მოკლე სათაური

**ტიპი:** განახლება | დამატება | ოპტიმიზაცია | წაშლა | კომენტარი

**აღწერა:**
- რა შეიცვალა და რატომ

**ფაილები:**
- `path/to/file.ts`

**კომენტარი:**
- დამატებითი შენიშვნები (სურვილისამებრ)
```

---

## აპლიკაციის ლოგიკა და ღილაკები

> სრული მიმოხილვა — როგორ მუშაობს აპი, რა ლოგიკაა უკან და რა ღილაკები/ელემენტები არსებობს.

---

### 1. აპლიკაციის ნაკადი (App Flow)

აპი 4 ეკრანს შორის მოძრაობს: `landing` → `input` → `loading` → `results`

| ეტაპი | კომპონენტი | აღწერა |
|-------|-----------|--------|
| `landing` | `LandingPage` | მთავარი გვერდი, CTA ღილაკით |
| `input` | `InputScreen` | მომხმარებლის პარამეტრების შეყვანა |
| `loading` | `LoadingScreen` | API მოთხოვნის დროს ანიმაცია |
| `results` | `ResultsPage` | გენერირებული მარშრუტის ჩვენება |

**მთავარი state (`App.tsx`):**
- `step` — მიმდინარე ეკრანი
- `preferences` — ქალაქი, დრო, ტრანსპორტი, ინტერესები
- `generatedPlan` — ბექენდიდან მიღებული გეგმა
- `history` — ბოლო 5 გეგმა (localStorage: `travel_planner_history`)

**გეგმის გენერაციის ლოგიკა (`handlePreferencesSubmit`):**
1. `step` → `loading`
2. `POST /api/plan` — preferences JSON-ით
3. წარმატებისას → `results`, გეგმა ისტორიაში (max 5)
4. შეცდომისას → უკან `input`-ზე

---

### 2. Header (ყველა ეკრანზე)

| ელემენტი | ID | ლოკაცია | ფუნქცია |
|----------|-----|---------|---------|
| **Compass ლოგო** | — | მარცხენა | `step` → `landing` (მთავარ გვერდზე დაბრუნება) |
| **Plan For badge** | — | მარჯვენა (desktop) | results-ზე: ქალაქი, დრო, ტრანსპორტი |
| **Back / Edit Preferences** | `header-nav-back` | მარჯვენა | `results` → `input`, `input` → `landing`, `loading` → `input` |

---

### 3. LandingPage — მთავარი გვერდი

| ღილაკი | ID | ფუნქცია |
|--------|-----|---------|
| **Start Planning** | `cta-start-planning` | `onStart()` → `step = "input"` |

**ვიზუალი:** headline, 3 feature card (Time Optimized, Zero Overwhelm, Offline-Ready Map) — მხოლოდ ინფორმაციული, ღილაკები არა.

---

### 4. InputScreen — პარამეტრების ფორმა

#### ველები და ლოგიკა

| ველი | ტიპი | ლოგიკა |
|------|------|--------|
| **ქალაქი** | text input (`input-city`) | სავალდებულო; trim-ით გაგზავნა |
| **სწრაფი ქალაქები** | ღილაკები | Tbilisi, Paris, Rome, Tokyo, New York — `setCity(c)` |
| **დრო** | 4 ღილაკი | `2h` (120წთ), `4h` (240), `6h` (360), `1day` (480) |
| **ტრანსპორტი** | 3 ღილაკი | `walk`, `car`, `mixed` |
| **ინტერესები** | 4 toggle | `history`, `nature`, `food`, `mixed` |

**ინტერესების toggle ლოგიკა (`handleInterestToggle`):**
- `mixed` არჩევა → მხოლოდ `["mixed"]`
- სხვა კატეგორია → `mixed` იშლება, toggle on/off
- თუ ცარიელი დარჩა → ავტომატურად `["mixed"]`

**Plan Preview:** live წინადადება — ქალაქი, დრო, ტრანსპორტი, ინტერესები.

| ღილაკი | ID | ფუნქცია |
|--------|-----|---------|
| **Generate My Plan** | `btn-generate-plan` | form submit → `onSubmit(preferences)` |

---

### 5. LoadingScreen — ჩატვირთვა

**ღილაკები არ არის** — მხოლოდ ანიმაცია:
- SVG მარშრუტის ხაზი
- MapPin / Sparkles pin-ები
- Loader2 spinner
- progress bar (3.5 წმ)

---

### 6. ResultsPage — შედეგები

#### State
- `selectedStopIndex` — არჩეული გაჩერება (default: 0)
- `simplifyMode` — აღწერების დამალვა/ჩვენება
- `isCopied` — clipboard copy სტატუსი (2 წმ)

#### რუკის პანელი (მარცხენა 55%) — `RouteMap` (Mapbox)

| ელემენტი | ფუნქცია |
|----------|---------|
| **Mapbox რუკა** | `streets-v12` სტილი, GPS კოორდინატებით |
| **Marker ღილაკები** (1, 2, 3...) | `onStopSelect(idx)` — გაჩერების არჩევა |
| **Route line** | stops-ს შორის ლურჯი LineString |
| **NavigationControl** | zoom +/- (მარჯვენა ზედა) |
| **flyTo** | არჩეულ stop-ზე გადასვლა |
| **fitBounds** | ყველა stop-ის ჩარჩოში მოქცევა |
| **Active Target badge** | მიმდინარე ქალაქი (overlay) |
| **Stop info card** (ქვედა) | არჩეული stop: სახელი, აღწერა, duration |

**Env:** `VITE_MAPBOX_ACCESS_TOKEN` — key-ის გარეშე placeholder ეკრანი

#### იტინერარის პანელი (მარჯვენა 45%)

| ღილაკი | ID | ფუნქცია |
|--------|-----|---------|
| **SlidersHorizontal** (header) | — | `onChangePreferences()` → `input` |
| **Simplify Plan / Detailed Plan** | `btn-simplify-plan` | `simplifyMode` toggle — აღწერების hide/show |
| **Copy plan text** | — | clipboard-ში stops ტექსტი (დრო, სახელი, duration, აღწერა) |
| **Timeline item click** | — | `setSelectedStopIndex(index)` — pin-თან სინქრონიზაცია |
| **Regenerate Plan** | `btn-regenerate-plan` | `onRegenerate()` — იგივე preferences-ით ახალი გეგმა |
| **Change Preferences** | — | `onChangePreferences()` → `input` |

**formatDuration:** ≥60 წთ → `Xh` / `X.Xh`, სხვა → `Xm`

---

### 7. Backend — სერვერი (`server.ts`)

| Endpoint | მეთოდი | ლოგიკა |
|----------|--------|--------|
| `/api/plan` | POST | `validatePlanRequest` → `generatePlanAsync` (AI ან fallback greedy) → JSON |
| — | — | 400: არასწორი body; 500: engine შეცდომა |

**Dev:** Vite middleware | **Production:** `dist/` static + SPA fallback

---

### 8. Route Engine — მარშრუტის გენერაცია (`routeEngine.ts`)

#### შეყვანა (TravelPreferences)
```
city, timeLimit (2h|4h|6h|1day), transport (walk|car|mixed), interests (string[])
```

#### ალგორითმის ნაბიჯები

1. **normalizeCity** — პირველი ასო დიდი
2. **filterPlaces** — ქალაქის ადგილები + ინტერესების ფილტრი; ცარიელი → fallback ყველა ადგილი
3. **buildGreedyRoute** — greedy nearest-neighbor:
   - საწყისი: უმაღლესი score landmark (ან top score)
   - თითო ნაბიჯზე: score-ით სორტირება, დროის ბიუჯეტის შემოწმება
   - max 7 stop, min 4 სცადოს
   - იგივე კატეგორია ზედიზედ არ დაემატოს (MIN_STOPS-ის შემდეგ)
4. **ensureMandatoryStops** — სავალდებულო: ≥1 landmark (history/culture) + ≥1 experience (food/nature)
5. **trimToTimeBudget** — ზედმეტი stops-ის მოჭრა popularity-ით
6. **buildFallbackPlan** — თუ greedy ვერ მოიძებნა სწორი route
7. **optimizeRouteForDaylight** — morning წინ, sunset viewpoints ბოლოში (Phase 3)
8. **assignSchedule** — startTime (10:00-დან), duration, description, timeOfDayNote
9. **buildTitle / buildRouteSummary / computeCenter** — metadata

#### Scoring ფორმულა (`scorePlace`)
```
popularityScore × 2
+ interestMatchBonus (5 ან 3)
- distancePenalty (walk×4, car×0.8, mixed×2)
+ categoryBalanceBonus (+2 ახალი კატ., -3 გამეორება)
+ weatherCompatibilityBonus (Phase 2 — ხელოვნური ამინდი)
```

#### Weather-aware Routing (Phase 2)

**მოდულები:**
- `server/lib/weather/` — `WeatherProvider` ინტერფეისი, `MockWeatherProvider`, `getWeatherForPlan()`
- `server/lib/weatherScoring.ts` — `weatherCompatibilityBonus(place, weather)`
- `placeKnowledge.ts` — `isOutdoorOnly`, `isIndoorPlace`, `isCoveredDining`, `isExposedViewpoint`

**ქცევა წვიმისას:**
- indoor ადგილები — ბონუსი
- მხოლოდ outdoor — ჯარიმა
- rainFriendly — ნაწილობრივი კომპენსაცია
- exposed viewpoint — ჯარიმა (heavy rain-ზე მკაცრი)
- covered dining (food + indoor/rainFriendly) — ბონუსი
- ღია ბაზარი — ჯარიმა

**Mock ამინდი (ქალაქის მიხედვით):**
| ქალაქი | სცენარი |
|--------|---------|
| Tbilisi | light-rain |
| Paris | cloudy |
| Rome | clear |
| Tokyo | light-rain |
| New York | heavy-rain |

Override: `weatherScenario` request body-ში ან `WEATHER_MOCK_SCENARIO` env.

**API პასუხი:** `TravelPlan.weather` (optional) — condition, precipitation, temperatureC, summary, simulated.

**ტესტი:** `npm run test:weather`

#### Sunrise / Sunset Optimizer (Phase 3)

**მოდულები:**
- `server/lib/daylight/` — `DaylightProvider`, `MockDaylightProvider`, `getDaylightForPlan()`
- `server/lib/daylightScoring.ts` — sunrise/sunset/golden hour scoring
- `server/lib/daylightOptimizer.ts` — `optimizeRouteForDaylight()` constrained reorder
- `placeKnowledge.ts` — `parseBestVisitSlot()`, `isSunsetViewpoint()`, `isMorningOptimal()`

**ქცევა:**
- morning/sunrise ადგილები → მარშრუტის დასაწყისში
- sunset/evening viewpoints → მარშრუტის ბოლოში
- golden hour ბონუსი metadata-ს მიხედვით (bestVisitTime + tags)
- reorder მხოლოდ თუ `fitsTimeBudget` ინახავს

**Mock daylight (ქალაქის მიხედვით):** sunrise/sunset preset-ები Tbilisi, Paris, Rome, Tokyo, New York

**API:** `TravelPlan.daylight` (optional), `PlanStop.timeOfDayNote` (optional)

**ტესტი:** `npm run test:daylight`

#### AI Route Planner (Phase 14)

**მოდულები:**
- `server/lib/ai/routePlanner.ts` — `generateAiPlan()` — AI-ით ადგილების არჩევა და დალაგება
- `server/lib/ai/config.ts` — DB პარამეტრები, მოდელის არჩევა, API key resolve (DB + env)
- `server/lib/ai/catalog.ts` — 6 პროვაიდერი, 20+ მოდელი
- `server/lib/ai/providers/` — Google Gemini, OpenAI-compatible, Anthropic
- `server/lib/planService.ts` — `generatePlanAsync()` — AI პირველ რიგში, შეცდომისას greedy fallback
- `server/lib/ai/seedAi.ts` — კატალოგის სინქრონიზაცია DB-ში

**ქცევა:**
- ყოველი მოთხოვნა უნიკალურია — რანდომ თემა, მაღალი temperature, მოდელების როტაცია
- AI იღებს ქალაქის ადგილების სიას → JSON `{ placeIds, title, routeSummary, theme }`
- ვალიდაცია: ≥2 stop, landmark + experience სავალდებულო
- შემდეგ: `trimToTimeBudget` → `optimizeRouteForDaylight` → `assignSchedule`
- AI გამორთული ან შეცდომისას → ძველი greedy ალგორითმი (`fallbackToGreedy`)

**პროვაიდერები და default მოდელები:**
| პროვაიდერი | Default მოდელი | API key env |
|------------|----------------|-------------|
| Google | Gemini 3.1 Pro (`gemini-3.1-pro-preview`) | `GEMINI_API_KEY` |
| OpenAI | GPT-5.5 (`gpt-5.5`) | `OPENAI_API_KEY` |
| Anthropic | Claude Opus 4.8 (`claude-opus-4-8`) | `ANTHROPIC_API_KEY` |
| Mistral | Mistral Large | `MISTRAL_API_KEY` |
| DeepSeek | DeepSeek Chat | `DEEPSEEK_API_KEY` |
| Groq | Llama 3.3 70B | `GROQ_API_KEY` |

**Prisma:** `AiProvider`, `AiModel`, `AiPlannerSettings`

**Admin:** `/admin/ai` — API keys, მოდელების ON/OFF, default, system prompt, variety slider, rotate models

**API endpoints (`/api/admin/ai/*`):**
- `GET/PUT /settings` — ზოგადი პარამეტრები
- `GET /providers`, `PUT /providers/:id` — პროვაიდერები + API key
- `PUT/POST/DELETE /models/:id` — მოდელების მართვა

**API პასუხი:** `TravelPlan.ai` (optional) — `{ provider, model, modelId, theme? }`

**Dev:** `npm run dev` → `tsx watch server.ts` (სერვერის ფაილების ცვლილებაზე ავტო-რესტარტი)

#### დროის ბიუჯეტი
| timeLimit | წუთები |
|-----------|--------|
| 2h | 120 |
| 4h | 240 |
| 6h | 360 |
| 1day | 480 |

**fitsTimeBudget:** visit time + travel time ≤ totalMinutes

---

### 9. Distance (`distance.ts`)

| ფუნქცია | ლოგიკა |
|---------|--------|
| **haversineDistanceKm** | GPS კოორდინატებს შორის km (Haversine) |
| **estimateTravelMinutes** | walk 5km/h, car 30km/h, mixed 15km/h |

---

### 10. მონაცემები (`places.ts`)

**მხარდაჭერილი ქალაქები:** Tbilisi, Paris, Rome, Tokyo, New York

**Place ველები:** id, name, city, category, lat, lng, avgVisitTime, popularityScore, description

**კატეგორიები:** history, nature, food, viewpoint, culture

**findCityPlaces(city):** case-insensitive ძებნა

---

### 11. ტიპები (`src/types.ts`)

```typescript
TravelPreferences { city, timeLimit, transport, interests, weatherScenario? }
PlanStop { name, category, lat, lng, duration, startTime, description, fullDescription?, localTips?, timeOfDayNote? }
TravelPlan { title, city, totalTime, center, stops, routeSummary, weather?, daylight?, ai? }
PlanWeather { condition, precipitation, temperatureC, summary, simulated }
PlanDaylight { sunrise, sunset, summary, simulated }
TravelPlan.ai { provider, model, modelId, theme? }
```

---

### 12. ავტორიზაცია (Auth)

#### ბაზა (SQLite + Prisma)
| ცხრილი | ველები |
|--------|--------|
| `users` | id, email, passwordHash, name, avatarUrl, emailVerified |
| `oauth_accounts` | provider (google/facebook), providerUserId, userId |
| `refresh_tokens` | tokenHash (SHA-256), expiresAt, revokedAt |
| `saved_plans` | userId, plan (JSON) — მომავალი გამოყენებისთვის |

#### API endpoints
| Endpoint | მეთოდი | აღწერა |
|----------|--------|--------|
| `/api/auth/register` | POST | email + password რეგისტრაცია |
| `/api/auth/login` | POST | შესვლა |
| `/api/auth/logout` | POST | გასვლა (CSRF + auth) |
| `/api/auth/refresh` | POST | access token განახლება |
| `/api/auth/me` | GET | მიმდინარე მომხმარებელი |
| `/api/auth/google` | GET | Google OAuth redirect |
| `/api/auth/google/callback` | GET | Google callback |
| `/api/auth/facebook` | GET | Facebook OAuth redirect |
| `/api/auth/facebook/callback` | GET | Facebook callback |

#### უსაფრთხოება
- bcrypt (12 rounds) პაროლისთვის
- JWT access token — 15 წთ, httpOnly cookie
- Refresh token — 7 დღე, httpOnly, DB-ში hashed, rotation
- CSRF — `csrf_token` cookie + `X-CSRF-Token` header
- Rate limit — 20 მცდელობა / 15 წთ auth endpoint-ებზე
- Helmet security headers
- OAuth state parameter — CSRF დაცვა
- `/api/plan` — მხოლოდ ავტორიზებული მომხმარებელი

#### Frontend
| ელემენტი | ფუნქცია |
|----------|---------|
| **Sign In** (header) | AuthModal გახსნა |
| **Logout** (header) | გასვლა |
| **AuthModal** | Login / Register + Google / Facebook |
| **AuthProvider** | user state, session refresh |

---

## ჩანაწერები

### [2026-06-29] — AI მოდელების კატალოგის განახლება

**ტიპი:** განახლება

**აღწერა:**
- კატალოგში დაემატა უახლესი მოდელები: GPT-5.5, Gemini 3.1, Claude Opus 4.8
- Anthropic 4.6+ მოდელებისთვის adaptive thinking მხარდაჭერა API-ში
- `seedAiDefaults` — default მოდელის სწორად გადაყენება პროვაიდერზე
- `npm run dev` გადავიდა `tsx watch`-ზე — სერვერის ცვლილებაზე ავტო-რესტარტი
- `AiSettingsPage` — JSON/HTML შეცდომის დამუშავება (ძველი სერვერის დიაგნოსტიკა)

**ფაილები:**
- `server/lib/ai/catalog.ts`
- `server/lib/ai/seedAi.ts`
- `server/lib/ai/providers/openaiCompatible.ts`
- `src/admin/pages/AiSettingsPage.tsx`
- `package.json`

---

### [2026-06-29] — AI Route Planner (Phase 14)

**ტიპი:** დამატება

**აღწერა:**
- AI-ით მარშრუტის დაგეგმვა — ყოველი გენერაცია განსხვავებული (თემა, temperature, მოდელის როტაცია)
- 6 პროვაიდერი: Google, OpenAI, Anthropic, Mistral, DeepSeek, Groq
- `POST /api/plan` → `generatePlanAsync` — AI პირველ რიგში, fallback greedy ალგორითმზე
- Admin პანელი: `/admin/ai` — API keys, მოდელები, system prompt, variety, rotate
- Prisma: `AiProvider`, `AiModel`, `AiPlannerSettings`
- `TravelPlan.ai` ველი — რომელი მოდელი გამოიყენა

**ფაილები:**
- `prisma/schema.prisma`
- `server/lib/ai/*` (catalog, config, routePlanner, seedAi, providers)
- `server/lib/planService.ts`
- `server/lib/routeEngine.ts` (`buildPlanFromRoute`, `buildEmptyPlan`)
- `server/routes/admin.ts` (`/api/admin/ai/*`)
- `server.ts`
- `src/admin/pages/AiSettingsPage.tsx`
- `src/admin/AdminApp.tsx`, `AdminLayout.tsx`
- `src/types.ts`
- `.env.example`

**კომენტარი:**
- API keys: env ცვლადები ან Admin პანელიდან DB-ში
- სერვერის ცვლილების შემდეგ საჭიროა რესტარტი (`tsx watch` ავტომატურად აკეთებს)

---

### [2026-06-29] — Admin CMS (Phase 13)

**ტიპი:** დამატება

**აღწერა:**
- Prisma CMS მოდელები: Country, Category, Place, PlaceTranslation, HiddenGemProfile, RouteTemplate, TravelPackage
- User.role (USER/ADMIN) + `requireAdmin` middleware
- `/api/admin/*` CRUD API — places, categories, countries, translations, story, hidden gems, route templates, packages
- `placeRepository` in-memory cache — Route Engine DB-დან კითხულობს (fallback: `places.ts`)
- Admin UI: `http://localhost:3000/admin` — 9 მოდული (+ AI Planner)
- Seed: `admin@voya.ai` / `Admin1234` + 42 ადგილის იმპორტი

**ფაილები:**
- `prisma/schema.prisma`, `prisma/seed.ts`
- `server/routes/admin.ts`
- `server/lib/cms/placeRepository.ts`, `initializeCms.ts`
- `server/lib/auth/middleware.ts` (`requireAdmin`)
- `src/admin/*`, `src/main.tsx` (react-router-dom)

**კრედენშალები:**
- Admin: `admin@voya.ai` / `Admin1234`

---

### [2026-06-29] — Sunrise / Sunset Optimizer (Phase 3)

**ტიპი:** დამატება

**აღწერა:**
- `DaylightProvider` არქიტექტურა — mock sunrise/sunset/golden hour ქალაქის მიხედვით
- `daylightScoring.ts` — sunriseScore, sunsetScore, goldenHourScore, daylightCompatibilityScore
- `daylightOptimizer.ts` — მარშრუტის reorder (morning წინ, sunset viewpoints ბოლოში), time budget ინარჩუნებს
- `placeKnowledge.ts` — parseBestVisitSlot, isSunsetViewpoint, isMorningOptimal
- `TravelPlan.daylight` + `PlanStop.timeOfDayNote` API-ში (optional)
- greedy არჩევა უცვლელი; ოპტიმიზაცია მხოლოდ reorder-ით assignSchedule-მდე

**ფაილები:**
- `server/lib/daylight/types.ts`, `mockProvider.ts`, `index.ts`, `timeUtils.ts`
- `server/lib/daylightScoring.ts`, `daylightOptimizer.ts`, `daylightScoring.test.ts`
- `server/lib/placeKnowledge.ts`, `server/lib/routeEngine.ts`
- `src/types.ts`, `package.json`

**ტესტი:** `npm run test:daylight`

---

### [2026-06-29] — Weather-aware Route Engine (Phase 2)

**ტიპი:** დამატება

**აღწერა:**
- `WeatherProvider` არქიტექტურა — mock provider ახლა, რეალური API მომავალში (`setWeatherProvider`)
- `weatherCompatibilityBonus` — scorePlace-ში ინტეგრირებული
- წვიმისას: indoor პრიორიტეტი, outdoor/viewpoint თავიდან აცილება, covered dining ბონუსი
- `TravelPlan.weather` metadata API პასუხში
- optional `weatherScenario` request-ში (backward compatible)
- `npm run test:weather` — unit + integration ტესტები

**ფაილები:**
- `server/lib/weather/types.ts`, `mockProvider.ts`, `index.ts`
- `server/lib/weatherScoring.ts`, `weatherScoring.test.ts`
- `server/lib/routeEngine.ts`, `server/lib/placeKnowledge.ts`
- `src/types.ts`, `package.json`

---

### [2026-06-29] — დემო მომხმარებელი

**ტიპი:** დამატება

**აღწერა:**
- `prisma/seed.ts` — demo user upsert
- `npm run db:seed` — seed გაშვება

**კრედენშალები:**
- Email: `demo@voya.ai`
- Password: `Demo1234`

**ფაილები:**
- `prisma/seed.ts`
- `package.json`

---

### [2026-06-29] — Place Knowledge Engine

**ტიპი:** დამატება

**აღწერა:**
- Place მოდელი გაფართოვდა (country, descriptions, ratings, environment, tags...)
- `definePlace()` + `placeKnowledge.ts` accessors
- 42 ადგილი რეალისტური მეტადატით
- Route Engine: typed accessors, ალგორითმი უცვლელი
- Story Mode: `fullDescription`, `localTips` PlanStop-ზე + `resolveStoryText()`

**ფაილები:**
- `server/types/place.ts`, `server/lib/placeKnowledge.ts`, `server/data/places.ts`
- `server/lib/routeEngine.ts`, `src/types.ts`, `src/lib/storyMode.ts`

---

### [2026-06-29] — ავტორიზაცია + OAuth + ბაზა

**ტიპი:** დამატება

**აღწერა:**
- SQLite + Prisma ბაზა (users, oauth_accounts, refresh_tokens, saved_plans)
- Email/password auth — bcrypt, JWT httpOnly cookies, refresh token rotation
- CSRF, rate limiting, Helmet
- Google + Facebook OAuth
- AuthModal, AuthProvider, Sign In/Logout header-ში
- `/api/plan` დაცულია — auth სავალდებულო

**ფაილები:**
- `prisma/schema.prisma`
- `server/routes/auth.ts`
- `server/lib/auth/*`
- `server/lib/db.ts`
- `src/context/AuthContext.tsx`
- `src/components/AuthModal.tsx`
- `src/lib/api.ts`
- `server.ts`, `src/App.tsx`

**კომენტარი:**
- OAuth: `.env`-ში GOOGLE_* / FACEBOOK_* + APP_URL
- `npm run db:push` — ბაზის შექმნა

---

**ტიპი:** გამოსწორება

**აღწერა:**
- რუკის კონტეი�ner-ს სიმაღლე 0 იყო — Mapbox ცარიელად ჩანდა
- დაემატა `ResizeObserver` + `map.resize()` — ინიციალიზაცია მხოლოდ ზომიერი container-ით
- Vite worker fix: `mapbox-gl-csp-worker?worker`
- layout გასწორდა `ResultsPage`/`App.tsx`-ში (`min-h-0`, `flex-1`, `absolute inset-0`)
- production build გადაკეთდა token-ით

**ფაილები:**
- `src/components/RouteMap.tsx`
- `src/components/ResultsPage.tsx`
- `src/App.tsx`
- `src/vite-env.d.ts`

---

**ტიპი:** დამატება

**აღწერა:**
- `.env` ფაილში ჩაისვა `VITE_MAPBOX_ACCESS_TOKEN`

**ფაილები:**
- `.env`

**კომენტარი:**
- token git-ში არ ხვდება (.gitignore)

---

### [2026-06-29] — Mapbox რუკის ინტეგრაცია

**ტიპი:** დამატება

**აღწერა:**
- დაინსტალირდა `mapbox-gl`
- შეიქმნა `RouteMap` კომპონენტი — რეალური Mapbox რუკა markers-ით, route line-ით, flyTo/fitBounds
- SVG mock რუკა შეიცვალა Mapbox-ით `ResultsPage`-ში
- `.env.example`-ში დაემატა `VITE_MAPBOX_ACCESS_TOKEN`

**ფაილები:**
- `src/components/RouteMap.tsx`
- `src/components/ResultsPage.tsx`
- `src/vite-env.d.ts`
- `vite.config.ts`
- `.env.example`
- `package.json`

**კომენტარი:**
- key-ის ჩასმა: `.env` ფაილში `VITE_MAPBOX_ACCESS_TOKEN="..."` — dev server restart საჭიროა

---

**ტიპი:** დამატება

**აღწერა:**
- `MEMORY.md`-ში დაემატა სექცია „აპლიკაციის ლოგიკა და ღილაკები“ — ყველა ეკრანი, ღილაკი, state, API და route engine ალგორითმი

**ფაილები:**
- `MEMORY.md`

---

### [2026-06-29] — API კონტრაქტის გაერთიანება

**ტიპი:** განახლება

**აღწერა:**
- წაიშალა `/api/generate-plan` და `planAdapter.ts`
- ერთი endpoint: `POST /api/plan` → პირდაპირ `TravelPlan` სქემა
- წაიშალა Gemini AI და legacy `mockData` fallback
- ფრონტი გადავიდა `stops`, `title`, `center`, `totalTime`, `routeSummary`-ზე

**ფაილები:**
- `server.ts`
- `server/lib/routeEngine.ts`
- `src/types.ts`
- `src/App.tsx`
- `src/components/ResultsPage.tsx`

---

### [2026-06-29] — Route Generation Engine (ბექენდი)

**ტიპი:** დამატება

**აღწერა:**
- დაემატა route generation engine: ფილტრაცია, სქორინგი, greedy nearest-neighbor, დროის ალოკაცია

**ფაილები:**
- `server/types/place.ts`
- `server/data/places.ts`
- `server/lib/distance.ts`
- `server/lib/routeEngine.ts`

---

### [2026-06-29] — მეხსიერების ფაილის შექმნა

**ტიპი:** დამატება

**აღწერა:**
- შეიქმნა `MEMORY.md` — პროექტის ცვლილებების, განახლებების, ოპტიმიზაციების, წაშლების და კომენტარების ჩასაწერად

**ფაილები:**
- `MEMORY.md`

**კომენტარი:**
- პირველი ჩანაწერი — შემდგომი ცვლილებები ჩაიწერება ამ ფორმატით

---

<!-- 
  ჩანაწერის მაგალითი:

  ### [2026-06-29] — მაგალითი

  **ტიპი:** განახლება

  **აღწერა:**
  - API endpoint განახლდა ახალი პარამეტრებით

  **ფაილები:**
  - `server.ts`
  - `src/api/client.ts`

  **კომენტარი:**
  - საჭიროა ტესტირება production-ზე
-->
