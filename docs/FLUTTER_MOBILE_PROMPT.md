# ZITF Connect - Flutter Mobile App Prompt

> **Use this prompt with an AI coding assistant to generate the Flutter mobile application.**
> **IMPORTANT:** Before using this prompt, read `DATABASE_SCHEMA.md` in this same folder — it contains the exact Supabase database schema, table definitions, relationships, enums, views, and RLS policies that the mobile app must integrate with.

---

## System Prompt

You are an expert Flutter developer. Generate a **full-featured, cross-platform mobile application** for iOS and Android called **"ZITF Connect"** with a **premium Apple-native UI/UX** that matches modern iOS system apps. Use the Flutter stable channel, Dart, and best practices.

This app connects to an **existing Supabase backend** that is already populated by a Next.js admin portal. The database schema is provided in the attached `DATABASE_SCHEMA.md` file — **do not create new tables or modify the existing schema**. The mobile app is a consumer of the data managed by the admin portal.

---

## Database Context (Summary)

The full schema is in `DATABASE_SCHEMA.md`. Here is the key information:

### Tables the mobile app reads from:
- **`halls`** — Exhibition halls with `geo_polygon` (array of `[lat, lng]` pairs) and `geo_center`
- **`exhibitors`** — Companies with `company_name`, `logo_url`, `category_id`, `hall_id`, `status`, contact info
- **`stands`** — Booths inside halls with `stand_number`, `geo_polygon`, `latitude`/`longitude`, `exhibitor_id`, `status`
- **`events`** — Scheduled events with `start_time`, `end_time`, `hall_id`, `speaker`, `status`, `capacity`
- **`visitors`** — App users / attendees with profile info and `badge_id`

### Tables the mobile app writes to:
- **`visitors`** — Profile creation/update for the logged-in user
- **`leads`** — Exhibitors insert leads when scanning visitor QR codes (`exhibitor_id`, `visitor_id`, `source`, `notes`, `is_qualified`)
- **`event_attendance`** — Visitor check-in to events (`event_id`, `visitor_id`)
- **`engagement_logs`** — Activity tracking (`visitor_id`, `action`, `metadata`)

### Enums:
```
exhibitor_status: pending | approved | rejected | active | inactive
stand_status: available | reserved | booked | unavailable
event_status: draft | published | cancelled | completed
lead_source: qr_scan | nfc_tap | manual | app_checkin
```

### Categories (App Constants):
`exhibitors.category_id` maps to a hardcoded list of 49 ZITF industry categories with IDs 183-399. See the full list in `DATABASE_SCHEMA.md`. Embed this as a Dart constant map in the app:
```dart
const Map<int, String> zitfCategories = {
  183: 'Banking, Insurance & Financial Services',
  184: 'ASAMBENI (Business Tourism)',
  // ... full list in DATABASE_SCHEMA.md
  399: 'Marketing',
};
```

### Geo Data Format:
- `halls.geo_polygon`: `List<List<double>>` — `[[lat1, lng1], [lat2, lng2], ...]` (3+ points, closed polygon)
- `halls.geo_center`: `List<double>` — `[lat, lng]`
- `stands.geo_polygon`: Same format as halls
- `stands.latitude` / `stands.longitude`: Stand centroid point

### Storage:
- Exhibitor logos: `exhibitors` bucket, path `logos/<filename>`. Public read access.
- URL format: `{SUPABASE_URL}/storage/v1/object/public/exhibitors/logos/<filename>`

---

## ZITF Brand Colors

```dart
// Primary / Accent
static const Color primary = Color(0xFFF69825);        // ZITF Orange
static const Color primaryHover = Color(0xFFD66A4F);    // Darker orange

// Backgrounds
static const Color bgPrimary = Color(0xFFFDFCF8);      // Light warm white
static const Color bgSecondary = Color(0xFFF7F5F0);     // Light warm grey

// Text
static const Color textPrimary = Color(0xFF1A1A1A);     // Near black
static const Color textSecondary = Color(0xFF666666);    // Medium grey

// iOS System Colors (for status badges)
static const Color iosBlue = Color(0xFF007AFF);
static const Color iosGreen = Color(0xFF34C759);
static const Color iosOrange = Color(0xFFFF9500);
static const Color iosRed = Color(0xFFFF3B30);
```

---

## UI/UX Specifications

- **Typography**: Inter (Variable), strict tracking and leading to mimic SF Pro
- **Visual Language**:
  - Backgrounds: Surface color (`#F2F2F7` light, `#000000` dark)
  - Gaussian blur (sigma 10-15) on AppBar and TabBar using `BackdropFilter`
  - Corner radii: 12pt for cards, 20pt for primary buttons (continuous curves via `SmoothRectangleBorder` or similar)
- **Haptic feedback**: `HapticFeedback.lightImpact` on all successful interactions
- **Smooth animations**, responsive layouts for mobile and tablets
- **Dark and light mode** support

---

## Functional Requirements

### 1. Authentication
- Supabase Auth (OAuth: Google/Apple, Magic Link email)
- **Role-based access**: Visitor role, Exhibitor role
- The app determines role by checking if the authenticated user's `id` exists in the `exhibitors` table (exhibitor) or `visitors` table (visitor)
- Profile creation with name, email, and optional company info
- On first login, create a row in `visitors` (or link to `exhibitors` if the email matches an exhibitor's `contact_email`)

### 2. Visitor Features
- **Interactive venue map** with MapLibre GL Flutter
  - Render hall polygons from `halls.geo_polygon` as colored overlays
  - Render stand polygons from `stands.geo_polygon` with status-based colors
  - Tap on a stand to see exhibitor info popup
- **Search exhibitors** by name, category, hall
- **Route from current GPS** location (blue pulsing dot) to exhibitor stand (straight-line polyline with distance)
- **Event schedule** tab with filtering by hall/category, bookmarking, live updates via Supabase Realtime
- **QR code generation**: Generate a QR code containing the visitor's profile as a signed JWT — exhibitors scan this to capture leads
- **Notifications** for events and announcements
- **Offline-first** support: cache exhibitors, events, halls, stands locally

### 3. Exhibitor Features
- Login via OAuth / Magic Link (match `contact_email` to exhibitor record)
- **Dashboard**: View assigned stand info, hall, lead count
- **Scan visitor QR codes** using `mobile_scanner` package
- Parse JWT locally and store lead in `leads` table
- Add notes/tags to captured leads
- **Offline queue**: Store leads locally when offline, background sync to Supabase when online
- **Real-time updates**: Subscribe to `leads` table for live lead count

### 4. Lead Capture Flow
```
Visitor App                    Exhibitor App
-----------                    --------------
1. Generate JWT QR code
   containing: {
     visitor_id,
     full_name,
     email,
     company,
     job_title
   }
                               2. Scan QR code
                               3. Parse JWT locally
                               4. Insert into `leads` table:
                                  - exhibitor_id (from auth)
                                  - visitor_id (from JWT)
                                  - source: 'qr_scan'
                               5. If offline, queue locally
                               6. Sync when online
```

### 5. Event & Schedule Engine
- Full event list from `events` table (filter `status = 'published'`)
- Filter by `hall_id` or category
- Bookmark events locally (SharedPreferences or local DB)
- Supabase Realtime subscription on `events` table for live schedule updates
- Push notifications via Firebase Cloud Messaging (FCM) with deep linking to event detail

### 6. Map & Navigation
- **MapLibre GL** implementation with:
  - Hall polygons rendered from `halls.geo_polygon` data
  - Stand polygons with color based on `stands.status`:
    - `available` = green, `reserved` = orange, `booked` = blue, `unavailable` = grey
  - Exhibitor markers with company name labels
- User location (blue pulsing dot) via GPS
- Route line (dashed polyline) from user to selected stand with distance in meters
- Tap stand -> popup with exhibitor name, stand number, "Navigate" button

### 7. Analytics & Reporting (Exhibitor only)
- Read from `v_leads_per_exhibitor` view for lead stats
- Show total leads, qualified leads, breakdown by source
- Export lead data as CSV

### 8. Offline-First Strategy
- **Local database**: SQLite via `drift` or `sqflite`
- Cache tables: `halls`, `exhibitors`, `stands`, `events` (read-only sync from Supabase)
- **Write queue**: `leads`, `event_attendance`, `engagement_logs` written locally first, synced when online
- **Conflict resolution**: Server wins for read-only data; append-only for leads/logs
- Map tiles cached offline
- QR scanning works fully offline

---

## Technical Stack

| Layer              | Technology                        |
|--------------------|-----------------------------------|
| Framework          | Flutter (Dart)                    |
| State Management   | Riverpod (or Bloc)                |
| Backend            | Supabase (Auth, DB, Storage, Realtime, Edge Functions) |
| Maps               | MapLibre GL Flutter               |
| Local DB           | SQLite via `drift`                |
| QR Code            | `qr_flutter` (generate), `mobile_scanner` (scan) |
| Notifications      | Firebase Cloud Messaging (FCM)    |
| HTTP               | `supabase_flutter` SDK            |
| JWT                | `dart_jsonwebtoken`               |
| Routing            | `go_router`                       |

---

## Project Structure

```
lib/
  main.dart
  app.dart

  config/
    supabase_config.dart          # Supabase URL + anon key
    theme.dart                    # ZITF brand theme (light/dark)
    constants.dart                # Categories, status configs, colors
    routes.dart                   # go_router configuration

  models/
    hall.dart
    exhibitor.dart
    stand.dart
    event.dart
    visitor.dart
    lead.dart
    category.dart

  services/
    auth_service.dart             # Supabase Auth wrapper
    supabase_service.dart         # DB queries
    sync_service.dart             # Offline sync queue
    location_service.dart         # GPS
    notification_service.dart     # FCM
    qr_service.dart               # JWT generation + scanning

  repositories/
    hall_repository.dart
    exhibitor_repository.dart
    stand_repository.dart
    event_repository.dart
    lead_repository.dart

  providers/                      # Riverpod providers
    auth_provider.dart
    hall_provider.dart
    exhibitor_provider.dart
    event_provider.dart
    lead_provider.dart
    map_provider.dart

  screens/
    auth/
      login_screen.dart
      signup_screen.dart

    visitor/
      visitor_home_screen.dart    # Tab bar: Map, Exhibitors, Events, Profile
      map_screen.dart             # Full venue map
      exhibitor_list_screen.dart  # Search + browse
      exhibitor_detail_screen.dart
      event_list_screen.dart      # Schedule with filters
      event_detail_screen.dart
      qr_code_screen.dart         # Show visitor's QR code
      profile_screen.dart

    exhibitor/
      exhibitor_home_screen.dart  # Tab bar: Dashboard, Scan, Leads, Profile
      dashboard_screen.dart       # Stats overview
      scan_screen.dart            # QR scanner
      lead_list_screen.dart       # All captured leads
      lead_detail_screen.dart     # Lead notes/qualification
      profile_screen.dart

  widgets/
    map/
      venue_map.dart              # MapLibre widget
      hall_polygon_layer.dart
      stand_polygon_layer.dart
      user_location_marker.dart
      route_line.dart

    cards/
      exhibitor_card.dart
      event_card.dart
      lead_card.dart
      stand_info_card.dart

    common/
      blur_app_bar.dart           # Gaussian blur AppBar
      blur_tab_bar.dart
      status_badge.dart
      search_bar.dart
      loading_skeleton.dart

  database/
    local_database.dart           # Drift/SQLite setup
    tables/                       # Local table definitions
    daos/                         # Data access objects
```

---

## Key Supabase Queries for the Mobile App

```dart
// Get all active exhibitors with their hall and stands
final exhibitors = await supabase
    .from('exhibitors')
    .select('*, halls(id, name), stands(id, stand_number, status, geo_polygon, latitude, longitude)')
    .eq('status', 'active')
    .order('company_name');

// Get all active halls with geo data
final halls = await supabase
    .from('halls')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

// Get published events with hall info
final events = await supabase
    .from('events')
    .select('*, halls(id, name)')
    .eq('status', 'published')
    .gte('end_time', DateTime.now().toIso8601String())
    .order('start_time');

// Get stands for a specific hall (for map rendering)
final stands = await supabase
    .from('stands')
    .select('*, exhibitors(id, company_name, logo_url)')
    .eq('hall_id', hallId)
    .order('stand_number');

// Insert a lead (exhibitor scanning visitor QR)
await supabase.from('leads').insert({
  'exhibitor_id': currentExhibitorId,
  'visitor_id': scannedVisitorId,
  'source': 'qr_scan',
  'notes': optionalNotes,
});

// Get exhibitor's lead stats
final stats = await supabase
    .from('v_leads_per_exhibitor')
    .select()
    .eq('exhibitor_id', currentExhibitorId)
    .single();

// Check in visitor to event
await supabase.from('event_attendance').insert({
  'event_id': eventId,
  'visitor_id': currentVisitorId,
});
```

---

## Constraints

- App must be performant (<25MB bundle size)
- 60fps smooth animations
- Modular, clean, and maintainable architecture
- Apple-native look and feel
- Must work with the **existing Supabase database** — no schema modifications
- Exhibitor logos load from Supabase Storage public URLs
- All geo data is `[latitude, longitude]` format (NOT `[longitude, latitude]`)

---

## Deliverables

1. Full Flutter project with proper folder structure
2. All UI components (map view, QR scanner, event list, lead list, dashboard)
3. Comments explaining each major section
4. Offline-first sync service
5. Production-ready, modular, maintainable code
