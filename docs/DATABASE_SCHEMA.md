# ZITF Connect - Database Schema Documentation

> **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
> **This document describes the exact database schema used by the ZITF Admin portal.**
> Use this as the source of truth when building mobile apps or any other client that connects to the same Supabase project.

---

## Connection

```
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # server-side only
```

---

## Enums (PostgreSQL)

```sql
CREATE TYPE admin_role      AS ENUM ('super_admin', 'admin', 'editor', 'viewer');
CREATE TYPE stand_status    AS ENUM ('available', 'reserved', 'booked', 'unavailable');
CREATE TYPE lead_source     AS ENUM ('qr_scan', 'nfc_tap', 'manual', 'app_checkin');
CREATE TYPE event_status    AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE exhibitor_status AS ENUM ('pending', 'approved', 'rejected', 'active', 'inactive');
```

---

## Tables

### 1. `profiles`
Admin portal user profiles (linked to `auth.users`).

| Column         | Type          | Nullable | Default         | Notes                              |
|----------------|---------------|----------|-----------------|------------------------------------|
| `id`           | `uuid` PK     | NO       | `auth.uid()`    | References `auth.users(id)`        |
| `email`        | `text`         | NO       |                 |                                    |
| `full_name`    | `text`         | NO       | `''`            |                                    |
| `avatar_url`   | `text`         | YES      | `null`          |                                    |
| `role`         | `admin_role`   | NO       | `'viewer'`      |                                    |
| `is_active`    | `boolean`      | NO       | `true`          |                                    |
| `last_sign_in` | `timestamptz`  | YES      | `null`          |                                    |
| `created_at`   | `timestamptz`  | NO       | `now()`         |                                    |
| `updated_at`   | `timestamptz`  | NO       | `now()`         |                                    |

---

### 2. `halls`
Exhibition halls / venue buildings.

| Column          | Type         | Nullable | Default  | Notes                                                  |
|-----------------|--------------|----------|----------|--------------------------------------------------------|
| `id`            | `uuid` PK    | NO       | `gen_random_uuid()` |                                                |
| `name`          | `text`        | NO       |          |                                                        |
| `description`   | `text`        | YES      | `null`   |                                                        |
| `map_url`       | `text`        | YES      | `null`   | URL to uploaded hall floor plan image                  |
| `map_type`      | `text`        | YES      | `null`   | e.g. `"floor_plan"`, `"satellite"`                     |
| `display_order` | `integer`     | NO       | `0`      | Sort order in lists                                    |
| `capacity`      | `integer`     | YES      | `null`   | Max people capacity                                    |
| `is_active`     | `boolean`     | NO       | `true`   |                                                        |
| `geo_polygon`   | `jsonb`       | YES      | `null`   | Array of `[lat, lng]` pairs defining hall boundary     |
| `geo_center`    | `jsonb`       | YES      | `null`   | `[lat, lng]` centroid of the hall                      |
| `created_by`    | `uuid`        | YES      | `null`   | FK to `profiles.id`                                    |
| `created_at`    | `timestamptz` | NO       | `now()`  |                                                        |
| `updated_at`    | `timestamptz` | NO       | `now()`  |                                                        |

**`geo_polygon` format** (GeoJSON-like):
```json
[[latitude1, longitude1], [latitude2, longitude2], [latitude3, longitude3], ...]
```
Minimum 3 points to form a closed polygon. Admin draws these on a Leaflet map.

---

### 3. `exhibitors`
Companies exhibiting at the trade fair.

| Column           | Type               | Nullable | Default     | Notes                                     |
|------------------|--------------------|----------|-------------|--------------------------------------------|
| `id`             | `uuid` PK           | NO       | `gen_random_uuid()` |                                    |
| `company_name`   | `text`               | NO       |             |                                            |
| `description`    | `text`               | YES      | `null`      |                                            |
| `contact_person` | `text`               | NO       |             |                                            |
| `contact_email`  | `text`               | NO       |             |                                            |
| `contact_phone`  | `text`               | YES      | `null`      |                                            |
| `website`        | `text`               | YES      | `null`      |                                            |
| `logo_url`       | `text`               | YES      | `null`      | Supabase Storage path (`exhibitors/logos/...`) |
| `status`         | `exhibitor_status`   | NO       | `'pending'` |                                            |
| `country`        | `text`               | YES      | `null`      |                                            |
| `industry`       | `text`               | YES      | `null`      | Legacy free-text field                     |
| `category_id`    | `integer`            | YES      | `null`      | Maps to ZITF category constants (see below)|
| `hall_id`        | `uuid`               | YES      | `null`      | FK to `halls.id` ON DELETE SET NULL        |
| `booth_size`     | `text`               | YES      | `null`      | e.g. `"3x3"`, `"6x6"`                     |
| `notes`          | `text`               | YES      | `null`      |                                            |
| `created_by`     | `uuid`               | YES      | `null`      | FK to `profiles.id`                        |
| `created_at`     | `timestamptz`        | NO       | `now()`     |                                            |
| `updated_at`     | `timestamptz`        | NO       | `now()`     |                                            |

**Relationships:**
- `exhibitors.hall_id` -> `halls.id` (many-to-one)
- `stands.exhibitor_id` -> `exhibitors.id` (one-to-many, stands assigned to exhibitor)

---

### 4. `stands`
Individual exhibition stands/booths within halls.

| Column          | Type          | Nullable | Default               | Notes                                         |
|-----------------|---------------|----------|-----------------------|-----------------------------------------------|
| `id`            | `uuid` PK     | NO       | `gen_random_uuid()`   |                                               |
| `hall_id`       | `uuid`         | NO       |                       | FK to `halls.id`                              |
| `exhibitor_id`  | `uuid`         | YES      | `null`                | FK to `exhibitors.id` ON DELETE SET NULL      |
| `stand_number`  | `text`         | NO       |                       | e.g. `"A-01"`, `"B-15"`                      |
| `label`         | `text`         | YES      | `null`                | Display label override                        |
| `polygon`       | `jsonb`        | YES      | `null`                | Indoor pixel coordinates `{x, y}[]` (legacy)  |
| `geo_polygon`   | `jsonb`        | YES      | `null`                | `[lat, lng][]` geographic boundary            |
| `status`        | `stand_status` | NO       | `'available'`         |                                               |
| `area_sqm`      | `numeric`      | YES      | `null`                | Area in square meters                         |
| `price`         | `numeric`      | YES      | `null`                | Price in USD                                  |
| `notes`         | `text`         | YES      | `null`                |                                               |
| `latitude`      | `float8`       | YES      | `null`                | Stand centroid latitude                       |
| `longitude`     | `float8`       | YES      | `null`                | Stand centroid longitude                      |
| `created_at`    | `timestamptz`  | NO       | `now()`               |                                               |
| `updated_at`    | `timestamptz`  | NO       | `now()`               |                                               |

**Status flow:**
- `available` -> exhibitor assigned -> `booked`
- `booked` -> exhibitor unassigned -> `available`
- `reserved` / `unavailable` are manually set by admin

When assigning an exhibitor to a stand, the admin sets `exhibitor_id` and the status auto-changes to `booked`. On unassign, `exhibitor_id` is set to `null` and status reverts to `available`.

---

### 5. `events`
Scheduled events, talks, workshops at the trade fair.

| Column        | Type           | Nullable | Default             | Notes                    |
|---------------|----------------|----------|---------------------|--------------------------|
| `id`          | `uuid` PK      | NO       | `gen_random_uuid()` |                          |
| `name`        | `text`          | NO       |                     |                          |
| `description` | `text`          | YES      | `null`              |                          |
| `hall_id`     | `uuid`          | YES      | `null`              | FK to `halls.id`         |
| `start_time`  | `timestamptz`   | NO       |                     |                          |
| `end_time`    | `timestamptz`   | NO       |                     |                          |
| `status`      | `event_status`  | NO       | `'draft'`           |                          |
| `speaker`     | `text`          | YES      | `null`              | Speaker name(s)          |
| `capacity`    | `integer`       | YES      | `null`              | Max attendees            |
| `image_url`   | `text`          | YES      | `null`              | Event cover image        |
| `created_by`  | `uuid`          | YES      | `null`              | FK to `profiles.id`      |
| `created_at`  | `timestamptz`   | NO       | `now()`             |                          |
| `updated_at`  | `timestamptz`   | NO       | `now()`             |                          |

---

### 6. `visitors`
Trade fair attendees (registered via mobile app or on-site).

| Column          | Type          | Nullable | Default             | Notes                     |
|-----------------|---------------|----------|---------------------|---------------------------|
| `id`            | `uuid` PK     | NO       | `gen_random_uuid()` | Can link to `auth.users`  |
| `full_name`     | `text`         | NO       |                     |                           |
| `email`         | `text`         | YES      | `null`              |                           |
| `phone`         | `text`         | YES      | `null`              |                           |
| `company`       | `text`         | YES      | `null`              |                           |
| `job_title`     | `text`         | YES      | `null`              |                           |
| `country`       | `text`         | YES      | `null`              |                           |
| `badge_id`      | `text`         | YES      | `null`              | Physical badge ID/barcode |
| `registered_at` | `timestamptz`  | NO       | `now()`             |                           |
| `created_at`    | `timestamptz`  | NO       | `now()`             |                           |
| `updated_at`    | `timestamptz`  | NO       | `now()`             |                           |

---

### 7. `leads`
Lead capture records — when an exhibitor scans a visitor's QR code.

| Column          | Type          | Nullable | Default             | Notes                         |
|-----------------|---------------|----------|---------------------|-------------------------------|
| `id`            | `uuid` PK     | NO       | `gen_random_uuid()` |                               |
| `exhibitor_id`  | `uuid`         | NO       |                     | FK to `exhibitors.id`         |
| `visitor_id`    | `uuid`         | NO       |                     | FK to `visitors.id`           |
| `source`        | `lead_source`  | NO       | `'qr_scan'`        | `qr_scan`, `nfc_tap`, `manual`, `app_checkin` |
| `notes`         | `text`         | YES      | `null`              | Exhibitor's notes about lead  |
| `is_qualified`  | `boolean`      | NO       | `false`             | Marked by exhibitor           |
| `captured_at`   | `timestamptz`  | NO       | `now()`             |                               |
| `created_at`    | `timestamptz`  | NO       | `now()`             |                               |

**Unique constraint:** `(exhibitor_id, visitor_id)` prevents duplicate leads.

---

### 8. `event_attendance`
Tracks which visitors attended which events.

| Column          | Type          | Nullable | Default             | Notes                |
|-----------------|---------------|----------|---------------------|----------------------|
| `id`            | `uuid` PK     | NO       | `gen_random_uuid()` |                      |
| `event_id`      | `uuid`         | NO       |                     | FK to `events.id`    |
| `visitor_id`    | `uuid`         | NO       |                     | FK to `visitors.id`  |
| `checked_in_at` | `timestamptz`  | NO       | `now()`             |                      |

---

### 9. `engagement_logs`
General visitor activity tracking.

| Column          | Type          | Nullable | Default             | Notes                     |
|-----------------|---------------|----------|---------------------|---------------------------|
| `id`            | `uuid` PK     | NO       | `gen_random_uuid()` |                           |
| `visitor_id`    | `uuid`         | NO       |                     | FK to `visitors.id`       |
| `exhibitor_id`  | `uuid`         | YES      | `null`              | FK to `exhibitors.id`     |
| `event_id`      | `uuid`         | YES      | `null`              | FK to `events.id`         |
| `action`        | `text`         | NO       |                     | e.g. `"stand_visit"`, `"qr_scan"`, `"event_checkin"` |
| `metadata`      | `jsonb`        | NO       | `'{}'`              | Arbitrary JSON context    |
| `occurred_at`   | `timestamptz`  | NO       | `now()`             |                           |

---

## Views (Analytics)

### `v_leads_per_exhibitor`
```sql
SELECT
  e.id AS exhibitor_id,
  e.company_name,
  COUNT(l.id) AS total_leads,
  COUNT(l.id) FILTER (WHERE l.is_qualified) AS qualified_leads,
  COUNT(l.id) FILTER (WHERE l.source = 'qr_scan') AS qr_leads,
  COUNT(l.id) FILTER (WHERE l.source = 'nfc_tap') AS nfc_leads,
  COUNT(l.id) FILTER (WHERE l.source = 'manual') AS manual_leads
FROM exhibitors e LEFT JOIN leads l ON e.id = l.exhibitor_id
GROUP BY e.id, e.company_name;
```

### `v_event_participation`
```sql
SELECT
  ev.id AS event_id,
  ev.name AS event_name,
  ev.start_time,
  h.name AS hall_name,
  COUNT(ea.id) AS attendee_count,
  ev.capacity,
  ROUND((COUNT(ea.id)::numeric / NULLIF(ev.capacity, 0)) * 100, 1) AS fill_rate_pct
FROM events ev
LEFT JOIN halls h ON ev.hall_id = h.id
LEFT JOIN event_attendance ea ON ev.id = ea.event_id
GROUP BY ev.id, ev.name, ev.start_time, h.name, ev.capacity;
```

### `v_daily_engagement`
```sql
SELECT
  DATE(occurred_at) AS day,
  action,
  COUNT(*) AS total_actions,
  COUNT(DISTINCT visitor_id) AS unique_visitors
FROM engagement_logs
GROUP BY DATE(occurred_at), action;
```

---

## Storage Buckets

| Bucket       | Public | Purpose                          |
|--------------|--------|----------------------------------|
| `exhibitors` | Yes    | Exhibitor logos (`logos/` prefix) |

---

## ZITF Categories (App Constants - NOT in DB)

Categories are stored as app-level constants (not a database table). The `exhibitors.category_id` is a plain integer that maps to this list:

| ID  | Name |
|-----|------|
| 183 | Banking, Insurance & Financial Services |
| 184 | ASAMBENI (Business Tourism) |
| 185 | PAKPRINT (Printing, Publishing & Stationery, Packaging, Labelling, Bottling) |
| 186 | SCHOLASTICA (Education, Training, Consultancy) |
| 187 | ULTIM8 HOME (Building, Construction, Hardware, Interior Decorating) |
| 188 | Advertising, Graphic Arts, Industrial Design |
| 189 | Agricultural Produce, Arboriculture, Horticulture, Fisheries |
| 190 | Agricultural & Irrigation Equipment, Water Engineering |
| 191 | Arts & Crafts |
| 192 | Automation |
| 193 | Automotive, Garage Equipment |
| 194 | Business Services: Management, Clearing & Forwarding, Courier, Consultancy, Insurance |
| 195 | Chemicals, Pharmaceuticals |
| 196 | Children's Goods |
| 197 | Civic Representation (Local Government) |
| 198 | Clothing, Textiles, Haberdashery, Upholstery, Production Machinery & Equipment |
| 199 | ICT, Office Equipment, Audio-Visual, Hi-Tech, Telecommunications |
| 200 | Consumer Goods, Gift Items, Jewellery, Accessories |
| 201 | Cosmetics, Toiletries, Hairdressing |
| 202 | Distributors and Wholesalers |
| 203 | Ecology, Conservation and Greening: Waste Management, Rehabilitation, Recycling |
| 204 | Electrical Engineering, Household Equipment |
| 205 | Electronics |
| 206 | Energy (Electric, Hydro, Solar, Thermal, Wind) |
| 207 | Event Management: Exhibitions, Conferences, Congresses, Meetings |
| 208 | Food, Food Processing, Beverages, Catering and Equipment |
| 209 | Footwear, Leather Goods |
| 210 | Furniture, Wood Products |
| 211 | Glassware, Porcelain, Crockery |
| 212 | Health: Services, Non-Pharmaceutical Products, Medical Aid Societies |
| 213 | Hydraulics and Lifting Equipment |
| 214 | Industrial Chemicals, Cleaning Materials & Equipment |
| 215 | Instrumentation |
| 216 | Light and Heavy Engineering, Tools |
| 217 | Media |
| 218 | Mining, Mineral Processing, Geology |
| 219 | Pharmaceuticals, Medical, Laboratory & Scientific Products, Instruments/Equipment |
| 220 | Plastics, Rubber |
| 221 | Pneumatic Equipment |
| 222 | Public Services (Govt): Administration, Culture, Health, Conservation, Education & Training |
| 223 | Refrigeration, Air-conditioning, Heating |
| 224 | Religious, Social Organisations, Services |
| 225 | Security: Manpower, Systems, Products |
| 226 | Transport: Aviation, Boating, Bicycles, Motorcycles, Rail, Vehicles |
| 395 | Legal (Corporate Law, Intellectual Property Law, Criminal Law) |
| 396 | Government Agencies |
| 397 | Sports and Culture |
| 398 | Manufacturing |
| 399 | Marketing |

---

## Entity Relationship Summary

```
profiles (admin users)
    |
halls ────────────────< stands >──────────── exhibitors
    |                      |                      |
    |                      |                      |
events                   leads  <───────────── visitors
    |                      |                      |
    └── event_attendance ──┘                      |
                                                  |
                              engagement_logs ─────┘
```

**Key relationships:**
- A **Hall** has many **Stands** (`stands.hall_id -> halls.id`)
- A **Hall** has many **Events** (`events.hall_id -> halls.id`)
- An **Exhibitor** is assigned to one **Hall** (`exhibitors.hall_id -> halls.id`)
- An **Exhibitor** has many **Stands** (`stands.exhibitor_id -> exhibitors.id`)
- An **Exhibitor** has many **Leads** (`leads.exhibitor_id -> exhibitors.id`)
- A **Visitor** has many **Leads** (`leads.visitor_id -> visitors.id`)
- A **Visitor** has many **Event Attendances** (`event_attendance.visitor_id -> visitors.id`)
- A **Visitor** has many **Engagement Logs** (`engagement_logs.visitor_id -> visitors.id`)

---

## Supabase Realtime Channels

The mobile app should subscribe to these for live updates:

```dart
// Events channel - live schedule updates
supabase.channel('events').onPostgresChanges(
  event: PostgresChangeEvent.all,
  schema: 'public',
  table: 'events',
  callback: (payload) => { ... }
).subscribe();

// Leads channel - for exhibitor app, real-time lead notifications
supabase.channel('leads').onPostgresChanges(
  event: PostgresChangeEvent.insert,
  schema: 'public',
  table: 'leads',
  filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: 'exhibitor_id', value: exhibitorId),
  callback: (payload) => { ... }
).subscribe();
```

---

## RLS (Row Level Security) Recommendations for Mobile

```sql
-- Visitors can read published events
CREATE POLICY "Public read events" ON events FOR SELECT USING (status = 'published');

-- Visitors can read active exhibitors
CREATE POLICY "Public read exhibitors" ON exhibitors FOR SELECT USING (status = 'active');

-- Visitors can read halls and stands
CREATE POLICY "Public read halls" ON halls FOR SELECT USING (is_active = true);
CREATE POLICY "Public read stands" ON stands FOR SELECT USING (true);

-- Exhibitors can read/write their own leads
CREATE POLICY "Exhibitor read own leads" ON leads FOR SELECT USING (exhibitor_id = auth.uid());
CREATE POLICY "Exhibitor insert leads" ON leads FOR INSERT WITH CHECK (exhibitor_id = auth.uid());

-- Visitors can read their own data
CREATE POLICY "Visitor read own profile" ON visitors FOR SELECT USING (id = auth.uid());
CREATE POLICY "Visitor update own profile" ON visitors FOR UPDATE USING (id = auth.uid());
```
