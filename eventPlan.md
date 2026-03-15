# 🗓️ Dynamic Events / Programs System — Idea & Architecture Plan

> **Status:** Admin Panel UI Ready ✅ — Planning API (Axios), Database, and Frontend (Next.js App).
> **Goal:** A fully server-driven, dynamic page system where the Admin Panel controls every field, label, input type, and layout of the Events/Programs page — with zero rebuilds required.

---

## 🧠 Core Concept

The idea is a **"Page Schema" system**. Instead of hardcoding any field on the Events/Programs page, every field is defined as a **JSON schema stored on the server** (Supabase database). The frontend reads this schema at runtime and **renders the form/page dynamically**.

> Think of it like a **form-builder inside the Admin Panel** — similar to how Google Forms or Typeform lets you build forms, except this is integrated directly into our app's admin panel and powers live public pages.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ADMIN PANEL                          │
│  /admin/events                                              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Page Builder UI (✅ Ready)                          │   │
│  │  - Create/Rename Page (e.g. "Eid Milad Program")     │   │
│  │  - Add / Remove / Reorder Fields                     │   │
│  │  - Configure each field:                             │   │
│  │      ✦ Label (e.g. "Full Name")                      │   │
│  │      ✦ Field Key (slug, e.g. "full_name")            │   │
│  │      ✦ Field Type (text, number, dropdown, etc.)     │   │
│  │      ✦ Options (for dropdowns, radios, etc.)         │   │
│  │      ✦ Validations (required, min, max, etc.)        │   │
│  │      ✦ Placeholder / Helper Text                     │   │
│  │      ✦ Visibility Conditions (show if X = Y)         │   │
│  └──────────────────────────────────────────────────────┘   │
│                        │  Save Schema via Axios to API       │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Supabase DB       │
              │  Table: event_pages │
              │  - id               │
              │  - slug             │
              │  - title            │
              │  - schema_fields    │
              │  - is_active        │
              │  - updated_at       │
              └─────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND APP                           │
│  /events/[slug]                                             │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Dynamic Page Renderer                               │   │
│  │  1. Fetch schema via axios from API (no cache)       │   │
│  │  2. Render each field based on its type              │   │
│  │  3. Handle submit → axios.post to API                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── events/
│   │   │       ├── route.js             ← GET all, POST new
│   │   │       └── [slug]/
│   │   │           ├── route.js         ← GET one, PUT update, DELETE
│   │   │           └── submissions/
│   │   │               └── route.js     ← GET submissions
│   │   └── events/
│   │       ├── route.js                 ← GET active events
│   │       └── [slug]/
│   │           ├── route.js             ← GET schema
│   │           └── submit/
│   │               └── route.js         ← POST form data
│   │
│   ├── admin/
│   │   └── events/
│   │       ├── page.js                  ← List of all event pages
│   │       └── [slug]/
│   │           └── page.js              ← Page builder (field editor)
│   │
│   └── events/
│       ├── page.js                      ← Grid list of active events
│       └── [slug]/
│           └── page.js                  ← Dynamic public-facing page
```

---

## 🗃️ The Schema JSON Format (The Brain of the System)

Every page/event in the database has a `schema_fields` JSON field that looks like this:

```json
{
  "page_title": "Eid Milad Program Registration",
  "page_slug": "eid-milad-2026",
  "description": "Register for the Eid Milad celebration event.",
  "submit_label": "Register Now",
  "fields": [
    {
      "id": "f1",
      "key": "full_name",
      "label": "Full Name",
      "type": "text",
      "placeholder": "Enter your full name",
      "required": true,
      "helperText": "As per your CNIC"
    },
    {
      "id": "f4",
      "key": "city",
      "label": "City",
      "type": "dropdown",
      "options": ["Karachi", "Lahore", "Islamabad", "Other"],
      "required": false
    },
    {
      "id": "f5",
      "key": "languages",
      "label": "Languages Known",
      "type": "array",
      "itemType": "text",
      "placeholder": "Add a language"
    }
  ]
}
```

---

## 🎛️ Supported Field Types

| Type | Description | Config Options |
|------|-------------|----------------|
| `text` | Single-line text input | `placeholder`, `required`, `helperText`, `minLength`, `maxLength` |
| `textarea` | Multi-line text area | `placeholder`, `rows`, `required` |
| `number` | Numeric input | `min`, `max`, `step`, `required` |
| `email` | Email input with validation | `placeholder`, `required` |
| `phone` | Phone number input | `placeholder`, `required` |
| `dropdown` | Select input | `options[]`, `required`, `placeholder` |
| `radio` | Radio button group | `options[]`, `required` |
| `checkbox` | Single checkbox | `required`, `label` |
| `checkboxGroup` | Multiple checkboxes | `options[]`, `required` |
| `array` | Dynamic list (add/remove items) | `itemType`, `placeholder`, `minItems`, `maxItems` |
| `object` | Nested sub-form | `fields[]` (recursive schema) |
| `button` | Action button | `action`: `popup` or `toast` |
| `popup` | Opens a modal with content | `popupTitle`, `popupContent` |
| `toast` | Fires a toaster notification | `toastMessage`, `toastType` |
| `divider` | Visual section separator | `label` (optional) |
| `heading` | Display-only heading/text | `text`, `size` (h2, h3, p) |
| `image` | Image upload | `maxSizeMB`, `accept` |
| `address` | Locality and City fields combined | `required` |
| `masjid` | Masjid name, Locality, City | `required` |

---

## 🌐 API Routes (Axios based)

All internal API communication will rely purely on **Axios** fetching Next.js Route Handlers.

### Admin Endpoints
- **`GET /api/admin/events`** — Fetch all built pages mapping across the Admin dashboard.
- **`GET /api/admin/events/[slug]`** — Fetch single schema layout into `/admin/events/[slug]`.
- **`POST /api/admin/events`** — Save new completely built event pages/forms from Admin UI.
- **`PUT /api/admin/events/[slug]`** — Modify existing event configurations.
- **`DELETE /api/admin/events/[slug]`** — Safely delete forms and their structure entirely.
- **`GET /api/admin/events/[slug]/submissions`** — Get user submission list.

### Public Endpoints
- **`GET /api/events`** — Fetch active (`is_active: true`) events only for the front page.
- **`GET /api/events/[slug]`** — Extract exact form schema data to construct the React interface dynamically on `/events/[slug]`.
- **`POST /api/events/[slug]/submit`** — The endpoint handling form pushes into `event_submissions` table using received JSON forms.

---

## 💻 Frontend — Public Pages

### 1. Events Listing Page: `/events/page.js`
- **Objective:** A landing hub for users querying current registrations/activities.
- **Data Flow:** Triggers `axios.get('/api/events')` right on load.
- **Appearance:** Presents a visually engaging grid of Event Cards.
  - Cards pull from schema settings, displaying the Title and Description natively.
  - Applies the defined `color` globally for uniform styling.
  - Contains a clickable "View & Register" button navigating to `/events/[slug]`.

### 2. Dynamic Registration Page: `/events/[slug]/page.js`
- **Objective:** Formats the specific URL into the generated logic produced by the admin builder.
- **Data Flow:** Pulls the JSON layout via `axios.get('/api/events/' + slug)`. The `DynamicFormRenderer` component uses the `schema_fields` JSON to append React inputs dynamically.
- **Appearance / Core UX:**
  - **Hero Section:** Shows an aesthetic banner with Event Page Title & Description, blending into the page's theme color gradient.
  - **Dynamic Inputs Display:** Forms appear vertically like a clean Google Form visual.
  - Text inputs deploy semantic HTML (`<input type="text">`, etc).
  - Dropdowns trigger contextual `<select>` tags. 
  - Action Buttons (Alerts/Popups) attach custom JS actions.
  - **Submission Formatting:** User edits are stored flat locally within `{ [field.key]: inputValue }`. On submit, hits `axios.post('/api/events/' + slug + '/submit', { formData })`. Shows overlay/loading until 200 OK. Returns an aesthetic "✅ Registration Successful" screen.

### Key Behaviors
- If a field is removed in admin → it disappears from the page instantly
- If a label is changed in admin → it updates on the page on next load
- If a new field is added → it appears with no code change
- Works for any event, any structure

---

## 🗄️ Supabase Tables (No Prisma)

### `event_pages` (Previously page_schemas)
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `title` | text | e.g. "Eid Milad-un-Nabi Program" |
| `slug` | text | URL slug (unique, e.g., eid-milad-2026) |
| `description` | text | Subtitle/description of the event |
| `theme_color` | text | Form theme color (e.g., "#7c3aed") |
| `submit_label` | text | Custom text for submit button |
| `is_active` | boolean | Is the page Live or still in Draft? |
| `schema_fields` | jsonb | The array of dynamic field objects (fields) |
| `created_at` | timestamp | Auto |
| `updated_at` | timestamp | Tracks last edit |

### `event_submissions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `event_slug` | text | Associates with event_pages.slug |
| `submitted_data` | jsonb | `{ "full_name": "Ali", "age": 25 }` |
| `submitted_at` | timestamp | Auto |

---

## 🚦 Implementation Phases

### Phase 1 & 2 — Admin UI & Field Builder (✅ COMPLETED)
- [x] Build admin `/admin/events/[slug]` page builder UI.
- [x] Implement Drag & Drop, Field Configuration Panels, Live Previews.

### Phase 3 — Database & API (▶ NEXT)
- [ ] Create `event_pages` and `event_submissions` tables in Supabase SQL (no Prisma).
- [ ] Create Axios Admin APIs (`/api/admin/events...`).
- [ ] Create Axios Public APIs (`/api/events...`).
- [ ] Hook up `/admin/events/[slug]` `Save` button to `POST/PUT /api/admin/events`.
- [ ] Hook up Admin List page `/admin/events` to `GET /api/admin/events`.

### Phase 4 — Public Frontend Renderer & Submissions
- [ ] Build `/events` public listing page using `axios.get('/api/events')`.
- [ ] Build `/events/[slug]` dynamic renderer using `axios.get('/api/events/[slug]')`.
- [ ] Handle form submission using `axios.post('/api/events/[slug]/submit')` → `event_submissions`.
- [ ] Add Admin view/table for submission data (`GET /api/admin/events/[slug]/submissions`).

---

*Plan updated: March 2026 — API & DB Schema Finalized for next phase.*
