# SisaBerkah Vertix V14 UI Redesign (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize SisaBerkah's dashboard layout and primary FEFO dashboard to match the SaaS "Dashboard V14" (Vertix concept) reference design — featuring a compact floating dock sidebar, top floating capsule tabs, instant Light/Dark mode, animated counter tickers, and a 3-column Bento Grid — while preserving 100% of existing food safety invariants, unit segregation rules, and role-based access control.

**Architecture:** Next.js 15 App Router with React 19, TypeScript, Tailwind CSS (`darkMode: 'class'`), and `framer-motion`. State management leverages React Context for themes (`ThemeContext`) and current user data (`UserContext`). Dashboard metrics are provided via a lightweight server route (`/api/dashboard/stats`) backed by Prisma queries without schema alterations.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Framer Motion, Prisma ORM, Vitest.

**Spec:** [docs/superpowers/specs/2026-11-17-vertix-ui-redesign-design.md](file:///d:/Sisa%20berkah/docs/superpowers/specs/2026-11-17-vertix-ui-redesign-design.md)

---

## Global Constraints

- **Platform:** Windows (Use `npm.cmd` rather than `npm` to avoid PowerShell execution policy blocks).
- **Theme Persistence:** Store theme preference in `localStorage` under key `sb_theme` (`'light' | 'dark'`), applying the `dark` class to `document.documentElement` without hydration flashes.
- **Food Safety & FEFO Invariant:** Food items with expiry `<= 24 jam` are strictly marked as `MENDEKATI_KEDALUWARSA` per `src/lib/fefo.ts`. Never alter or loosen this threshold.
- **Unit Segregation Invariant:** Never sum quantities across mismatched units (e.g., 10 kg + 50 porsi $\ne$ 60). Aggregates on the Hero Metric card must be segregated per unit.
- **RBAC Enforcement:** Menu items and operational actions restricted to `ADMIN` must remain invisible/inaccessible to `RELAWAN`.
- **Zero Test Regressions:** All existing 92 Vitest tests across the repository must remain passing at all times.

---

## File Structure & Module Map

```
src/
  lib/
    theme-context.tsx              # Light / Dark mode React context & provider
  components/
    layout/
      floating-dock.tsx            # Left slim vertical dock (theme switch, nav icons, logout)
      top-header.tsx               # Top floating bar with capsule tabs, search, notifications, profile
    dashboard/
      hero-metric-card.tsx         # Total stock counter ticker, unit filter, quick action pills
      bento-stat-card.tsx          # Glassmorphic stat cards with framer-motion hover lift
      analytic-bar-chart.tsx       # Vertical rounded bar chart for rescue/distribution trends
      recent-activity-card.tsx     # Activity feed with status badges & filter
      fefo-queue-card.tsx          # Interactive FEFO priority queue table
  app/
    api/
      dashboard/
        stats/
          route.ts                 # Aggregated dashboard metrics endpoint
    (dashboard)/
      layout.tsx                   # Refactored modern floating shell layout
      dashboard/
        page.tsx                   # Refactored 3-column Bento Grid FEFO dashboard
tests/
  theme.test.ts                    # Unit tests for theme logic
  dashboard-stats.test.ts          # Unit tests for dashboard stats API
  e2e-smoke.test.ts                # Updated route & component smoke verification
```

---

## Task 1: Install Framer Motion & Set Up Theme Engine

- [ ] **Step 1: Install `framer-motion` package**
  Run: `npm.cmd install framer-motion`
  Verify that `package.json` includes `framer-motion`.

- [ ] **Step 2: Ensure Tailwind CSS Dark Mode configuration**
  Inspect `tailwind.config.ts`. Verify or configure `darkMode: 'class'` to allow manual switching via the `.dark` class.

- [ ] **Step 3: Create Theme Context & Provider**
  Create `src/lib/theme-context.tsx`:
  - Manage state `theme: 'light' | 'dark'`.
  - Provide `toggleTheme()` and `setTheme(theme)`.
  - On mount, detect preference from `localStorage.getItem('sb_theme')` or fallback to `window.matchMedia('(prefers-color-scheme: dark)')`.
  - Dynamically toggle the `dark` class on `document.documentElement` and persist choice to `localStorage`.
  - Prevent SSR hydration mismatch by initializing cleanly.

- [ ] **Step 4: Create unit test for Theme Context logic**
  Create `tests/theme.test.ts`:
  - Test initial theme resolution from localStorage.
  - Test toggling between `'light'` and `'dark'`.
  - Run: `npm.cmd test tests/theme.test.ts`
  - Verify all theme tests pass.

- [ ] **Step 5: Commit changes**
  Commit Task 1 changes with message: `feat(ui): install framer-motion and implement light/dark theme provider`.

---

## Task 2: Build the Floating Dock Sidebar Component

- [ ] **Step 1: Create `src/components/layout/floating-dock.tsx`**
  Implement the Left Slim Floating Dock (~68px):
  - **Top:** Animated Sun/Moon toggle button utilizing `useTheme()` with smooth icon rotation.
  - **Center:** Module navigation icon stack with tooltips and active state indicator (rounded pill/circle):
    - `LayoutDashboard` -> `/dashboard` (Ringkasan)
    - `Boxes` -> `/makanan/masuk` (Pangan & Stok)
    - `Truck` -> `/distribusi` (Distribusi)
    - `Building2` -> `/donatur` (Data Master Donatur & Penerima)
    - `UserCog` -> `/pengguna` (Kelola Pengguna - `adminOnly: true`)
    - `FileBarChart2` -> `/laporan` (Laporan & Audit - `adminOnly: true`)
  - **Bottom:** System status indicator dot and `LogOut` action button with confirmation dialog/direct logout flow.
  - Filter admin-only icons based on `currentUser?.role`.
  - Fully support Dark Mode classes: `dark:bg-[#15181e]`, `dark:border-white/10`, `dark:text-white`.

- [ ] **Step 2: Add Mobile Drawer toggle compatibility**
  Ensure the dock can transition into a slide-over drawer on small screens (`lg:hidden`).

- [ ] **Step 3: Verify Dock functionality**
  Run existing smoke tests: `npm.cmd test tests/e2e-smoke.test.ts`.
  Verify no syntax or import errors.

- [ ] **Step 4: Commit changes**
  Commit Task 2 changes with message: `feat(ui): create floating dock sidebar with theme toggle and RBAC nav`.

---

## Task 3: Build the Top Floating Header Bar with Capsule Tabs

- [ ] **Step 1: Create `src/components/layout/top-header.tsx`**
  Implement the Top Floating Bar:
  - **Left Section:** SisaBerkah Brand Badge (rounded square with `SB` logo and "SisaBerkah" title).
  - **Center Section:** Segmented Capsule Tabs:
    - Tab list:
      1. `Ringkasan` (`/dashboard`)
      2. `Pangan Masuk` (`/makanan/masuk`)
      3. `Kelola Stok` (`/makanan/kelola`, admin only)
      4. `Distribusi` (`/distribusi`)
      5. `Data Master` (`/donatur`, with active state matching `/donatur` or `/penerima`)
      6. `Laporan` (`/laporan`, admin only)
    - Sliding active pill indicator with `framer-motion` layout transition (`layoutId="activeTab"`).
    - Role-based filtering hiding admin tabs for `RELAWAN`.
  - **Right Section:**
    - Search icon button with `⌘K` visual badge.
    - Notification bell with unread alert dot.
    - Profile chip: User Avatar, Name, and Role Badge (`ADMIN` / `RELAWAN`).
    - Mobile menu button (`Menu` icon) to open the dock drawer on mobile.

- [ ] **Step 2: Refactor `src/app/(dashboard)/layout.tsx`**
  - Integrate `ThemeProvider` wrapping the dashboard.
  - Replace the legacy wide green sidebar with `<FloatingDock />`.
  - Insert `<TopHeader />` at the top of the main content canvas.
  - Set background canvas to support seamless Light/Dark mode: `bg-[#f8fafc] dark:bg-[#0c0e12] text-slate-900 dark:text-slate-100`.
  - Ensure main viewport scrolling is smooth with `overflow-y-auto`.

- [ ] **Step 3: Run smoke tests and build check**
  Run: `npm.cmd test tests/e2e-smoke.test.ts`
  Verify layout mounts cleanly without hydration issues.

- [ ] **Step 4: Commit changes**
  Commit Task 3 changes with message: `feat(ui): integrate top header capsule tabs and modernize dashboard shell`.

---

## Task 4: Create Aggregated Dashboard Stats API Route

- [ ] **Step 1: Create `src/app/api/dashboard/stats/route.ts`**
  Implement `GET /api/dashboard/stats`:
  - Enforce session authentication (`requireAuth(request)`).
  - Query active food inventory with `remainingQuantity > 0` and `physicalStatus = 'DITERIMA'`.
  - Compute FEFO evaluation dynamically using `computeExpiryStatus(item.expiryAt)`.
  - Group remaining stock strictly by unit:
    - `totalPorsi`: sum of `remainingQuantity` where `unit = 'porsi'`.
    - `totalKg`: sum of `remainingQuantity` where `unit = 'kg'`.
    - `otherUnits`: array of `{ unit, total }` for any other units.
  - Count inventory by FEFO status:
    - `countAman`: items evaluated as `AMAN`.
    - `countMendekati`: items evaluated as `MENDEKATI_KEDALUWARSA` (<= 24 jam).
    - `countKedaluwarsa`: items evaluated as `KEDALUWARSA`.
  - Query distributions updated today with status `DITERIMA` to compute `disalurkanHariIni`.
  - Query count of active donors (`isActive: true`).
  - Return JSON payload with all metrics.

- [ ] **Step 2: Create unit tests for `/api/dashboard/stats`**
  Create `tests/dashboard-stats.test.ts`:
  - Test authentication requirement (401 when unauthenticated).
  - Test unit segregation (verify porsi and kg are not combined).
  - Test FEFO categorization (verify items <= 24h are accurately reported in `countMendekati`).
  - Run: `npm.cmd test tests/dashboard-stats.test.ts`.
  - Verify all tests pass.

- [ ] **Step 3: Commit changes**
  Commit Task 4 changes with message: `feat(api): create aggregated dashboard stats endpoint`.

---

## Task 5: Build Bento Grid Dashboard Widgets

- [ ] **Step 1: Create `src/components/dashboard/hero-metric-card.tsx`**
  Implement the Hero Metric Card (Column 1):
  - Animated number ticker using `framer-motion` or numeric easing.
  - Unit Filter Selector (`Porsi` | `Kg` | `Semua Satuan`) allowing staff to toggle view without violating unit integrity.
  - Secondary unit pill indicators (e.g. `+ 45 kg, 12 kotak`).
  - Monthly food rescue progress bar with goal calculation.
  - Pill action buttons:
    - Primary Emerald: `+ Catat Pangan Masuk` (links to `/makanan/masuk`).
    - Secondary Ghost: `Jadwalkan Distribusi` (links to `/distribusi/buat`).

- [ ] **Step 2: Create `src/components/dashboard/bento-stat-card.tsx`**
  Implement the 2x2 Bento Stat Cards (Column 2):
  - Wrapped in `<motion.div whileHover={{ y: -5 }}>`.
  - Variant 1 (Gradient Coral/Amber Accent): **Urgensi FEFO Kritis** (`countMendekati` <= 24 jam) with warning icon, pulsating badge, and direct shortcut to filter FEFO queue.
  - Variant 2 (Clean Glassmorphism): **Stok Aman (Segar)**.
  - Variant 3 (Clean Glassmorphism): **Penyaluran Hari Ini**.
  - Variant 4 (Clean Glassmorphism): **Donatur Aktif**.
  - Support `dark:bg-[#15181e] dark:border-white/10 dark:text-white`.

- [ ] **Step 3: Create `src/components/dashboard/analytic-bar-chart.tsx`**
  Implement the Analytic Chart Widget (Column 3):
  - Time range selector tabs: `Minggu` (Week), `Bulan` (Month), `Tahun` (Year).
  - Vertical bar visualizer with rounded caps (`rounded-t-lg`), dual-tone bar colors for rescued vs distributed food.
  - Food safety status distribution bars (percentage of Aman vs Mendekati vs Kedaluwarsa).

- [ ] **Step 4: Create `src/components/dashboard/recent-activity-card.tsx`**
  Implement the Recent Activity Feed:
  - Table/list of latest food intake and distribution batches.
  - Filter dropdown and instant search input.
  - High-contrast status badges (`DITERIMA`, `TERJADWAL`, `DIKIRIM`, `AMAN`).

- [ ] **Step 5: Verify components compile cleanly**
  Run: `npm.cmd run build` (or verify via vitest).
  Ensure no TypeScript or JSX compilation errors.

- [ ] **Step 6: Commit changes**
  Commit Task 5 changes with message: `feat(ui): create bento grid dashboard widgets with framer-motion`.

---

## Task 6: Assemble the Revamped FEFO Dashboard Page

- [ ] **Step 1: Refactor `src/app/(dashboard)/dashboard/page.tsx`**
  - Integrate all Bento components into a 3-column desktop layout (`grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6`).
  - Add Dynamic Welcome Banner:
    - Greeting based on current time ("Selamat Pagi / Siang / Sore, [Nama]").
    - Subtitle: "Pantau stok pangan masuk, prioritas FEFO, dan jadwal distribusi secara realtime."
  - Mount Column 1 (Hero Metric Card - 4 cols).
  - Mount Column 2 (2x2 Bento Stat Cards & Recent Activity - 5 cols).
  - Mount Column 3 (Analytic Bar Chart & Safety Distribution - 3 cols).
  - Mount Bottom Section: Full-width **Antrean Prioritas FEFO** with live search, unit filters, and immediate "Salurkan" scheduling action for items expiring soonest.

- [ ] **Step 2: Connect real-time data fetching**
  - Fetch data from `/api/dashboard/stats` and `/api/food/fefo`.
  - Include graceful loading skeleton states matching the Bento card geometry.
  - Include empty state handling with informative action triggers.

- [ ] **Step 3: Run comprehensive smoke and integration tests**
  Run: `npm.cmd test tests/e2e-smoke.test.ts`
  Verify that all dashboard components mount properly.

- [ ] **Step 4: Commit changes**
  Commit Task 6 changes with message: `feat(ui): assemble modernized vertix-style fefo dashboard page`.

---

## Task 7: Full Regression Verification & Quality Gate

- [ ] **Step 1: Run full Vitest test suite**
  Run: `npm.cmd test`
  Confirm that all 13 test suites and 92+ tests pass with 0 failures.

- [ ] **Step 2: Run Production Build check**
  Run: `npm.cmd run build`
  Verify Next.js build generates all static and dynamic pages with 0 errors.

- [ ] **Step 3: Validate theme switching and RBAC**
  - Verify that switching to Dark Mode properly renders dark glassmorphic cards and dark canvas.
  - Verify that logging in as `RELAWAN` conceals Admin-only tabs (`Kelola Stok`, `Laporan`, `Kelola Pengguna`).
  - Verify that food items <= 24 hours are prominently highlighted in the coral gradient card.

- [ ] **Step 4: Final commit & documentation**
  Commit final polish with message: `chore: finalize vertix v14 ui redesign phase 1`.

