# AWY — Always With You

## What Is It?

AWY is a personal command centre that lives in your browser. Think of it as a private, all-in-one workspace — somewhere between a smart notebook, a developer toolkit, and a daily planner.

Everything is in one tab. You pick which tools you want visible on your dashboard, and they stay there each time you open the app. Your data is saved locally on your device instantly, and also quietly backed up to the cloud so nothing is ever lost.

The app adapts between desktop and mobile — on a phone you navigate from a bar at the bottom; on a computer there's a sidebar and a keyboard shortcut search palette (`⌘K`).

---

## The 12 Modules

| Module | What it does |
|---|---|
| **Tasks** | To-do list with priorities (Normal / High / Urgent), statuses, categories, due dates and estimates. Pin important tasks to the top. |
| **Checklist** | Daily habits tracker with streak counters. Resets automatically each day. |
| **Mental Load** | Log your cognitive energy level (1–5) throughout the day with tags like `#DeepWork` or `#BadSleep`. Visualises your focus trend over time. |
| **Deep Work** | Full-screen focus timer. Blocks distractions and tracks your session. |
| **Notes** | Rich text note editor with folders (Work, Personal, Ideas, Journal), pinning, and markdown support. |
| **Meeting Navigator** | Multi-timezone clock. Shows working hours for multiple cities and highlights overlapping availability for scheduling. |
| **Fridge** | Code & text snippet storage. Save command-line shortcuts, API snippets, boilerplate — whatever you copy repeatedly. Pin the most-used ones. |
| **Toolbox** | 19 developer utilities (see below). All instantly accessible. |
| **Soundscape** | Ambient audio mixer for focus sessions (background sounds). |
| **Health** | Monitors your network latency, fetches your public IP, and pings any custom status pages you add. |
| **Smart Asset** | Warranty and receipt tracker. Upload receipts (with OCR scanning), track purchase dates and warranty expiry. |
| **Worklog Stream** | Manual work log. Enter what you worked on and for how long — formatted for Jira time tracking. |

---

## The 19 Toolbox Tools

Utility tools that open directly in the browser — no installation needed.

**Developer**
- JSON Formatter
- JWT Debugger
- Text Diff
- Time Converter
- UUID Generator
- URL Encoder
- Base64 Encoder
- Hash Generator (MD5 / SHA-1 / SHA-256)
- CSV Transformer

**Text & Data**
- Case Converter (camelCase / snake_case / kebab-case)
- Lorem Ipsum Generator
- Password Generator
- Text Cleaner

**Creative**
- Color Picker (HEX / RGB / HSL)
- QR Code Generator
- PDF Manager (merge / split)
- Profile Cropper (circular image crop)
- EXIF Viewer (image metadata)
- Meme Maker (add captions to images)

---

## Dashboard

The home screen is a fully customisable grid of widgets. Each widget shows a live summary of its module — pinned tasks, recent snippets, today's work total, current mental load score, etc. — and has a quick-action button so you can log or create something without leaving the dashboard. You can add, remove, and drag widgets into any order.

---

## Technical Details

### Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19.2.1 |
| Language | TypeScript 5.8.2 |
| Build Tool | Vite 6.2.0 |
| Backend / Auth / DB | Supabase 2.90.1 |
| Rich Text Editor | TipTap 3.19.0 |
| Animations | Framer Motion 12.34.0 |
| Icons | Lucide React 0.556.0 |
| Styling | Tailwind CSS (custom design tokens) |
| PDF Processing | pdf-lib 1.17.1 |
| OCR (receipts) | tesseract.js 7.0.0 |
| Image Cropping | react-easy-crop 5.5.6 |
| QR Codes | react-qr-code 2.0.18 |
| Image Metadata | exifreader 4.36.1 |
| Date Utilities | date-fns 4.1.0 |
| Mobile Drawer | vaul 1.1.2 |
| Device Detection | react-device-detect 2.2.3 |

---

### Architecture

#### Routing
Hash-based routing — no page reloads, works on GitHub Pages without a server.

```
#dashboard          Home with customisable widget grid
#tasks              Full task list
#notes              Notes app
#notes?id=<id>      Open specific note
#toolbox            Toolbox hub
#toolbox?tool=json  Open specific tool directly
#tasks?action=create  Open create modal directly
```

#### Layout — Desktop vs Mobile

**Desktop**
```
┌──────────┬────────────────────────────────────┐
│ Sidebar  │         Main Content               │
│ (icons)  │   (Full App or Dashboard Grid)     │
│          │                                    │
│          │              + ⌘K Command Palette  │
└──────────┴────────────────────────────────────┘
```

**Mobile**
```
┌────────────────────────────────┐
│      Main Content (scrollable) │
│                                │
│                                │
│                      [+] FAB   │
├────────────────────────────────┤
│  Home  │  Tasks  │  Apps  │ Me │
└────────────────────────────────┘
```

#### State Management

No Redux or Zustand. Three layers:

1. **React Context** — Auth state, device type, mobile FAB action
2. **`localStorage`** — Instant offline-capable reads/writes
3. **Supabase** — Async cloud sync after every local write

Every write goes to `localStorage` first for zero-latency feedback, then syncs to Supabase in the background.

#### Module System

Each module is a `ModuleManifest` object:

```typescript
{
  id: string
  name: string
  icon: LucideIcon
  description: string
  AppComponent: React.ComponentType     // Full-page view
  WidgetComponent: React.ComponentType  // Dashboard card
  quickAction?: {
    label: string
    hash: string   // e.g. '#tasks?action=create'
    icon: LucideIcon
  }
}
```

All 19 tools use `React.lazy()` for code splitting — they only load when opened.

---

### Data Models

```typescript
Task {
  id, title, priority ('low' | 'medium' | 'high'),
  status ('todo' | 'in_progress' | 'done' | 'wont_do'),
  isFocused, estimate, dueDate, category, completed, createdAt
}

Note {
  id, title, content, category, isPinned, createdAt
}

Snippet {
  id, title, content, language, tag, isPinned, updatedAt
}

Habit {
  id, name, streak, completedToday, lastCompletedDate
}

LoadEntry {
  level (1–5), note, chips: string[], timestamp
}

DashboardWidget {
  id, moduleId, x, y, w, h  // grid units
}

Worklog {
  id, work_item, raw_content, start_time, end_time,
  duration_minutes, date
}

Asset {
  id, productName, storeName, purchaseDate, price,
  currency, warrantyDurationMonths, receiptUrl, createdAt
}
```

---

### Supabase Schema

**Tables**

| Table | Purpose |
|---|---|
| `tasks` | Task data |
| `notes` | Note content + metadata |
| `folders` | Note folder definitions |
| `snippets` | Fridge snippets (`is_pinned` column added in migration `20260322`) |
| `habits` | Checklist habit state |
| `load_entries` | Mental load log |
| `meeting_locations` | Timezone locations |
| `assets` | Warranty tracker items |
| `daily_logs` | Worklog entries |
| `dashboard_layouts` | Per-user widget grid layout (`layout_json` JSONB) |
| `user_settings` | Pinned modules, preferences |
| `system_checks` | Health monitor endpoints |

**Storage**
- Bucket: `receipts` — uploaded receipt images and PDFs

---

### Authentication

Provider: Supabase (Google OAuth + Email/Password)

**Safe Session Policy:**
- Sessions stored in `localStorage`
- Maximum session age: **72 hours** — enforced on every app load
- 401 interception: global fetch wrapper fires `supabase:auth:401` → auto logout
- On logout: full `localStorage` wipe (`sb-*` keys + `auth_login_timestamp`)

---

### `localStorage` Keys

| Key | Data |
|---|---|
| `awy_dashboard_layout` | Widget grid state |
| `awy_power_tasks` | Task backup |
| `awy_notes_data` | Notes backup |
| `awy_folders_data` | Folders backup |
| `awy_fridge_snippets` | Snippets backup |
| `awy_checklist_data` | Habits backup |
| `awy_mental_load_data` | Load entries backup |
| `awy_meeting_navigator_locs` | Locations backup |
| `awy_task_categories` | Custom task categories |
| `awy_active_day_logs_<DATE>` | Daily worklog cache |
| `auth_login_timestamp` | Session age tracking |

---

### Tailwind Design Tokens

| Token | Role |
|---|---|
| `workspace-canvas` | Page background |
| `workspace-panel` | Card backgrounds |
| `workspace-sidebar` | Sidebar / subtle fills |
| `workspace-border` | Borders |
| `workspace-accent` | Primary colour (`#2471ED`) |
| `workspace-text` | Primary text |
| `workspace-secondary` | Muted / secondary text |

---

### Deployment

```
Build:   npm run build   →  /dist
Deploy:  npm run deploy  →  GitHub Pages
URL:     filipveskrna.github.io/Awy/
Base:    /Awy/  (vite.config.ts → base: '/Awy/')
```

---

### Codebase Size

| Category | Count |
|---|---|
| Source files (.ts / .tsx) | ~100 |
| Modules | 12 |
| Lazy-loaded tools | 19 |
| Services | 16 |
| Components | ~50 |


