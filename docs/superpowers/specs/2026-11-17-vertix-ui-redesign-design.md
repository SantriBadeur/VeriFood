# SisaBerkah Vertix V14 UI Redesign - Phase 1 Design Document

**Document:** `docs/superpowers/specs/2026-11-17-vertix-ui-redesign-design.md`  
**Date:** 2026-11-17  
**Scope:** Phase 1 - Shell Layout & Main FEFO Dashboard Redesign  
**Target Platform:** Next.js 15 App Router, React 19, Tailwind CSS, TypeScript

---

## 1. Intent & The Why

SisaBerkah is a food bank logistics and FEFO (*First Expired, First Out*) inventory management platform. Currently, the dashboard shell utilizes a traditional wide green sidebar (`bg-[#2B6153]`) and standard card widgets. 

The goal is to modernize SisaBerkah's visual aesthetics and user experience to match the modern SaaS **"Dashboard V14" (Vertix concept)** shown in the reference video:
- A floating vertical dock sidebar with an interactive **Light/Dark mode** switch.
- A floating top navigation bar with **sliding segmented pill tabs**.
- A 3-column **Bento Grid** dashboard featuring animated metric counters, interactive glassmorphic cards (`framer-motion`), a prominent gradient card for urgent FEFO alerts, a rounded bar chart, and a clean FEFO prioritization queue.

All existing food bank safety rules, FEFO priority logic, and Role-Based Access Control (`ADMIN` vs `RELAWAN`) will remain fully preserved and integrated.

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals
1. **Theme Engine (Light & Dark Mode):** Provide an instant, flicker-free Light/Dark theme provider persisted in `localStorage` (`sb_theme`), toggled directly via the dock sidebar.
2. **Modern Floating Shell (`DashboardLayout`):**
   - Replace the legacy sidebar with a compact **Floating Dock Sidebar** (~68px) on the left.
   - Implement a **Top Floating Header Bar** with centered segmented pill navigation (`Ringkasan`, `Pangan Masuk`, `Kelola Stok`, `Distribusi`, `Data Master`, `Laporan`) that highlights the active tab with fluid sliding indicators.
   - Filter menu items according to the user's role (`ADMIN` vs `RELAWAN`).
   - Retain responsive drawer behavior for mobile devices.
3. **Micro-interactions with `framer-motion`:**
   - Smooth hover lifts (`whileHover={{ y: -5 }}`) on cards.
   - Animated counter ticker for major numeric metrics.
   - Fluid tab indicator transitions.
4. **Bento Grid FEFO Dashboard (`/dashboard`):**
   - **Hero Metric Card (Left):** Total Pangan Tersedia with animated ticker, unit filter selector (Porsi / Kg / Semua Satuan), monthly distribution progress bar, and quick-action pill buttons (`+ Catat Pangan Masuk` & `Jadwalkan Distribusi`).
   - **Center 2x2 Bento Cards:**
     - 1 Gradient Accent Card for urgent FEFO alerts (`MENDEKATI_KEDALUWARSA` <= 24 hours).
     - 3 Glassmorphic Stat Cards: Stok Aman, Penyaluran Hari Ini, Donatur Aktif.
     - Recent operational activities table with search and filter.
   - **Right Analytics Card:** Rounded vertical bar chart showing weekly/monthly food rescue & distribution volume, plus food safety status distribution.
   - **Bottom Table:** Antrean Prioritas FEFO with live dynamic expiry tags.

### Non-Goals (Phase 1)
- Redesigning inner forms of `/makanan/masuk`, `/makanan/kelola`, `/distribusi/buat`, `/laporan` (these will continue to work seamlessly inside the new layout container; targeted in Phase 2).
- Altering database schema or modifying existing Prisma models.

### Anti-Goals
- Do not break existing unit tests or FEFO calculation invariants (e.g. `MENDEKATI_KEDALUWARSA` remains strictly `<= 24 jam` per `src/lib/fefo.ts`).
- Never perform cross-unit additions (e.g. summing kg and porsi into one number).
- Do not introduce heavy animation libraries that cause stuttering or hydration mismatches in Next.js 15 / React 19.

---

## 3. Approaches Considered & Trade-offs

| Approach | Description | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- | :--- |
| **Approach A (Chosen)** | **Phase 1: Shell Layout & Main FEFO Dashboard** | Fast delivery, delivers the core visual transformation seen in the video, zero risk to existing operational form workflows. | Inner pages still use previous styling until Phase 2. | **Selected by user** |
| **Approach B** | **Full System Overhaul (Shell + Dashboard + All 8 Pages)** | Unified look across every single screen at once. | Higher surface area, higher risk of regression on complex operational forms (multi-item distribution, inspection checklists). | Deferred to Phase 2 |

---

## 4. UI & Architectural Specifications

### 4.1 Theme Management (`ThemeProvider`)
- Location: `src/components/theme-provider.tsx` (or `src/lib/theme-context.tsx`).
- Manages state `'light' | 'dark'` and toggles the `dark` class on `document.documentElement`.
- Reads initial preference from `localStorage.getItem('sb_theme')` or system preference `(prefers-color-scheme: dark)`.
- Color tokens:
  - **Light Mode:** Canvas `bg-slate-50` / `bg-[#f8fafc]`, Card `bg-white`, Border `border-slate-200/80`, Text `text-slate-900`.
  - **Dark Mode:** Canvas `dark:bg-[#0c0e12]`, Card `dark:bg-[#15181e]`, Border `dark:border-white/10`, Text `dark:text-white`.
  - **Brand Accents:** Primary Emerald (`#2B6153` / `emerald-600`), Warm Amber Accent (`#F4B942` / `amber-500`), and Coral/Orange Gradient for critical FEFO urgency cards.

### 4.2 Shell Navigation & Routing Map
To avoid orphaned pages and ensure 100% route accessibility:
- **Left Floating Dock (`<FloatingDock />`):**
  - **Top:** Sun/Moon toggle button with smooth icon rotation.
  - **Center Module Icons:**
    1. Dashboard: `/dashboard` (`LayoutDashboard`)
    2. Makanan & Stok: `/makanan/masuk` (Relawan) & `/makanan/kelola` (Admin) (`Boxes`)
    3. Distribusi: `/distribusi` (`Truck`)
    4. Donatur & Penerima: `/donatur` (`Building2`) & `/penerima` (`Users2`)
    5. Kelola Pengguna: `/pengguna` (Admin only) (`UserCog`)
    6. Laporan & Audit: `/laporan` (Admin only) (`FileBarChart2`)
  - **Bottom:** System status / Audit log icon and Logout button.
- **Top Floating Header Bar (`<TopHeader />`):**
  - **Left:** Logo SisaBerkah (SB Badge + typography).
  - **Center Segmented Pill Tabs:**
    - `Ringkasan` (`/dashboard`)
    - `Pangan Masuk` (`/makanan/masuk`)
    - `Kelola Stok` (`/makanan/kelola` - Admin only)
    - `Distribusi` (`/distribusi`)
    - `Data Master` (`/donatur` / `/penerima`)
    - `Laporan` (`/laporan` - Admin only)
    *(Active pill sliding indicator follows the current route group seamlessly)*
  - **Right:** Quick Search trigger, Notifications icon with unread indicator badge, and Profile chip with current user name and role badge (`ADMIN` / `RELAWAN`).

### 4.3 Bento Grid FEFO Dashboard (`src/app/(dashboard)/dashboard/page.tsx`)
- **Hero Welcome Banner:**
  - Greeting dynamically adjusted to time of day ("Selamat Pagi / Siang / Sore, [Nama Pengguna]").
  - Subtitle: "Pantau stok pangan masuk, prioritas FEFO, dan jadwal distribusi secara realtime."
- **Grid Layout (3 Columns on desktop `lg:grid-cols-12`):**
  - **Col 1 (Left - 4 cols):** Hero Metric Card
    - Total Stok Pangan Tersedia (numeric counter ticker).
    - **Unit Filter Selector:** Segregated tabs (`Porsi` vs `Kg` vs `Semua`), strictly summing quantities for the selected unit to preserve unit integrity invariant. Displays secondary badges for remaining units (e.g., `+ 30 kg, 15 kotak`).
    - Target Penyaluran Bulanan progress bar.
    - Two action pill buttons:
      - `+ Catat Pangan Masuk` (primary emerald pill).
      - `Jadwalkan Distribusi` (ghost/outline pill).
  - **Col 2 (Center - 5 cols):** 2x2 Bento Stat Cards & Recent Activity
    - *Card 1 (Gradient Coral/Amber Accent):* Makanan Mendekati Kedaluwarsa (<= 24 jam) with countdown alert and quick-distribute link. Strictly respects `computeExpiryStatus` from `src/lib/fefo.ts`.
    - *Card 2 (Clean Glass):* Stok Aman (Siap Disalurkan).
    - *Card 3 (Clean Glass):* Makanan Tersalurkan Hari Ini.
    - *Card 4 (Clean Glass):* Donatur Aktif.
    - *Recent Activity Box:* Mini-table / list of recent food batches & distributions with status badges and search filter.
  - **Col 3 (Right - 3 cols):** Analytic Bar Chart & Food Safety Distribution
    - Interactive Bar Chart showing rescue volume trends (Week / Month / Year tabs).
    - Food safety status breakdown pill bars (Aman vs Mendekati Kedaluwarsa vs Kedaluwarsa).
- **Bottom Section:**
  - Dedicated **Antrean Prioritas FEFO** with search, status filters, and one-click schedule action for items closest to expiration.

### 4.4 Data Loading & API Strategy
- Create a lightweight aggregated endpoint `GET /api/dashboard/stats` (or parallel fetch `/api/food/fefo`, `/api/distributions`, `/api/donors`) to efficiently supply dashboard metrics without schema modifications.

---

## 5. Dependencies & Technical Verification

- **`framer-motion`**: Install `framer-motion` compatible with React 19 / Next.js 15.
- **Testing & Verification:**
  - Verify layout renders cleanly without hydration mismatch.
  - Verify Light/Dark mode toggling persists on page refresh.
  - Verify RBAC visibility: Admin sees all tabs, Relawan sees only authorized tabs.
  - Verify existing Vitest test suite (`npm run test`) continues passing with 100% success.
