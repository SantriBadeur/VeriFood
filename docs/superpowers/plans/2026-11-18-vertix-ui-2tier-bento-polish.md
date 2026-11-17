# SisaBerkah Vertix UI Perfectionist Polish (Pendekatan 1: 2-Tier Bento Grid) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the SisaBerkah FEFO dashboard into a world-class, pixel-perfect SaaS interface (Vertix V14 style) by eliminating all serif typography artifacts, restructuring the layout into an elegant 2-Tier Bento Grid (Tier 1: Hero 5-col + Bento Stats 7-col; Tier 2: Analytic Chart 5-col + Activity Feed 7-col; Tier 3: FEFO Queue 12-col), completely removing dead space voids, and preventing any text wrapping or chart clipping while maintaining 100% test suite passage and food safety invariants.

**Architecture:** Next.js 15 App Router with React 19, TypeScript, Tailwind CSS (`darkMode: 'class'`), Lucide React, and Framer Motion. Restructure `src/app/(dashboard)/dashboard/page.tsx` into a 2-tier bento grid architecture where content heights and widths naturally align without artificial vertical stretching (`items-stretch`). Enforce a clean modern sans-serif typography system across the application canvas.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Framer Motion, Vitest.

**Spec Reference:** [docs/superpowers/specs/2026-11-17-vertix-ui-redesign-design.md](file:///d:/Sisa%20berkah/docs/superpowers/specs/2026-11-17-vertix-ui-redesign-design.md)

---

## Global Constraints

- **Platform:** Windows (Always invoke `npm.cmd` rather than `npm` to avoid PowerShell execution policy blocks).
- **Typography:** Strictly prohibit serif/Times New Roman across the entire application canvas. Use the clean modern sans-serif stack (`font-sans`) with tabular figures (`tabular-nums`) for numeric data.
- **Unit Segregation Invariant:** Never sum quantities across mismatched units (e.g. porsi vs kg). Display secondary units as individual, segregated badge pills.
- **FEFO Priority Threshold:** Items with remaining shelf life $\le 24\text{ jam}$ must remain marked as `MENDEKATI_KEDALUWARSA` with urgent visual hierarchy.
- **Zero Test Regressions:** All 13 test suites and 92+ Vitest tests across the repository must remain passing at all times.

---

## Review Focus

1. **Zero Text Wrapping in Analytic Chart:** "Tren Logistik Pangan" and "Penyelamatan vs Penyaluran" must stay on single lines without wrapping on desktop viewports ($\ge 1024\text{px}$).
2. **Zero Chart Clipping on Edge:** Sunday ("Min") dual-bars and labels must have $\ge 16\text{px}$ clearance from the right card border.
3. **No Dead Space in Hero Metric Card:** The vertical gap between the secondary unit pills and progress bar must not exceed $24\text{px}$, aligning naturally with the 2x2 Bento Stat Cards height (~340px).
4. **Dock Active State Elegance:** The active navigation item must not render protruding misaligned side tabs; it must render a clean integrated background highlight with smooth transitions.
5. **Night-Vision Contrast:** The "Disalurkan" bar in dark mode must use soft slate/emerald tints (`dark:bg-emerald-200/80` or `dark:bg-slate-300`) instead of blinding pure white (`#ffffff`).

---

## Task Decomposition & Execution Steps

### Task 1: Typography System Restoration (Eliminate Times New Roman)

**Files:**
- Modify: `src/app/globals.css:13-20`
- Modify: `src/app/layout.tsx:16`
- Modify: `src/app/(dashboard)/layout.tsx:45`

**Interfaces:**
- Consumes: Tailwind default `font-sans` stack.
- Produces: Clean, modern sans-serif typography for all headings, body, buttons, inputs, and numeric counters.

- [x] **Step 1: Inspect and remove serif overrides from `globals.css`**
  Remove lines 13–20 in `src/app/globals.css` that force:
  ```css
  html, body, input, button, select, textarea {
    font-family: 'Times New Roman', Times, serif;
  }
  ```
  Ensure `@layer base` configures `font-sans` with proper letter-spacing and font smoothing.

- [x] **Step 2: Update `src/app/layout.tsx` root body class**
  Change line 16 from:
  ```tsx
  <body className="antialiased min-h-screen font-serif">{children}</body>
  ```
  to:
  ```tsx
  <body className="antialiased min-h-screen font-sans bg-[#f8fafc] dark:bg-[#0c0e12] text-slate-900 dark:text-zinc-100 selection:bg-emerald-500 selection:text-white">{children}</body>
  ```

- [x] **Step 3: Run smoke test to verify no styling/runtime breakages**
  Run: `npm.cmd test tests/e2e-smoke.test.ts`
  Verify: Tests pass with 0 errors.

- [x] **Step 4: Commit typography changes**
  Run:
  ```bash
  git add src/app/globals.css src/app/layout.tsx
  git commit -m "fix(ui): eliminate times new roman and enforce modern sans-serif font system"
  ```

---

### Task 2: Floating Dock Polish & Indicator Refinement

**Files:**
- Modify: `src/components/layout/floating-dock.tsx:90-180`

**Interfaces:**
- Consumes: `useTheme()`, `CurrentUser` context.
- Produces: Polished vertical dock with clean integrated active item pill, consistent vertical rhythm, and no awkward protruding artifacts.

- [x] **Step 1: Refactor active indicator on nav items**
  In `src/components/layout/floating-dock.tsx`, remove the awkward protruding sliver:
  ```tsx
  {active && (
    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-4 rounded-r-full bg-emerald-500 dark:bg-emerald-400" />
  )}
  ```
  Replace with a sleek integrated active style:
  - Active background: `bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-md`
  - Subtle glowing emerald dot or ring inside the button to signify active state cleanly without border overflows.

- [x] **Step 2: Fix dock vertical spacing and separators**
  - Replace `my-auto` on `<nav>` with a structured flex layout: `flex flex-col items-center gap-2.5 py-2 w-full`.
  - Replace arbitrary thin divider (`w-7 h-[1px]`) with a refined micro-divider (`w-8 h-[1px] bg-slate-200/80 dark:bg-zinc-800`).
  - Add safe margin at top to ensure no overlap with Next.js development badges.

- [x] **Step 3: Run theme and smoke tests**
  Run: `npm.cmd test tests/theme.test.ts tests/e2e-smoke.test.ts`
  Verify: All tests pass.

- [x] **Step 4: Commit FloatingDock polish**
  Run:
  ```bash
  git add src/components/layout/floating-dock.tsx
  git commit -m "fix(ui): polish floating dock active indicators and vertical rhythm"
  ```

---

### Task 3: HeroMetricCard Micro-Spacing & Natural Height Alignment

**Files:**
- Modify: `src/components/dashboard/hero-metric-card.tsx:58-175`

**Interfaces:**
- Consumes: `totalPorsi`, `totalKg`, `unitBreakdown`, `selectedUnit`, `onSelectUnit`.
- Produces: Compact hero card with zero dead space, perfect number baseline alignment, and clean secondary unit pills that naturally matches the height of 2x2 Bento Stat Cards (~340px).

- [x] **Step 1: Tighten vertical spacing and remove artificial stretching**
  - Remove excessive vertical stretching (`justify-between` with uncontrolled height).
  - Use structured section spacing:
    - Top header & unit filter: `mb-3`
    - Value & Unit display: `my-2` with `tabular-nums` and aligned font weights.
    - Secondary units: `flex flex-wrap items-center gap-1.5 mt-2.5`. Ensure all pills share uniform height (`h-6`) and padding (`px-2.5 py-0.5`).
    - Monthly progress bar: `my-4` with enhanced label contrast (`text-slate-700 dark:text-zinc-300`).
    - Quick actions: `pt-2 gap-2.5` with clean button geometry.

- [x] **Step 2: Improve optical alignment for value and label**
  Align the big metric counter and unit label using `items-baseline gap-2`:
  ```tsx
  <div className="flex items-baseline gap-2">
    <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-sans tabular-nums">
      {displayValue.toLocaleString('id-ID')}
    </h2>
    <span className="text-sm sm:text-base font-semibold text-slate-500 dark:text-zinc-400">
      {selectedUnit === 'all' ? 'Porsi (Utama)' : selectedUnit}
    </span>
  </div>
  ```

- [x] **Step 3: Run tests to verify metric card rendering**
  Run: `npm.cmd test tests/e2e-smoke.test.ts`
  Verify: Tests pass.

- [x] **Step 4: Commit HeroMetricCard refinements**
  Run:
  ```bash
  git add src/components/dashboard/hero-metric-card.tsx
  git commit -m "fix(ui): eliminate dead space and polish micro-spacing in hero metric card"
  ```

---

### Task 4: AnalyticBarChart Width, Anti-Wrapping & Visual Tuning

**Files:**
- Modify: `src/components/dashboard/analytic-bar-chart.tsx:53-190`

**Interfaces:**
- Consumes: `countAman`, `countMendekati`, `countKedaluwarsa`.
- Produces: Spacious bar chart widget leveraging a 5-column span (~480px) with single-line header, zero clipping, and harmonious dark-mode colors.

- [x] **Step 1: Refactor header layout for wide viewport**
  - Implement a clean flex header that easily fits the icon, title, subtitle, and tabs without any wrapping:
    ```tsx
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shrink-0">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
            Tren Logistik Pangan
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium whitespace-nowrap">
            Penyelamatan vs Penyaluran
          </p>
        </div>
      </div>
      {/* Time range switcher */}
      ...
    </div>
    ```

- [x] **Step 2: Generous bar margins and zero edge-clipping**
  - In a 5-column width, 7 days have ample horizontal room (~60px per day).
  - Use `w-3 sm:w-3.5` bars with `gap-1 sm:gap-1.5`.
  - Add generous padding `px-4` inside the chart area so Sunday ("Min") bars are centered with $\ge 20\text{px}$ clearance from the card edge.
  - Add `pt-1 pb-1` padding to day labels.

- [x] **Step 3: Soften dark-mode bar contrast**
  - Change Disalurkan bar from `dark:bg-white` to `dark:bg-emerald-200/90` or `dark:bg-slate-300` to eliminate visual glare and unify the palette.
  - Update legend dot to match.

- [x] **Step 4: Run tests**
  Run: `npm.cmd test tests/e2e-smoke.test.ts`
  Verify: Tests pass.

- [x] **Step 5: Commit AnalyticBarChart fixes**
  Run:
  ```bash
  git add src/components/dashboard/analytic-bar-chart.tsx
  git commit -m "fix(ui): optimize analytic chart for 5-column width with single-line header and zero clipping"
  ```

---

### Task 5: Rebalance Dashboard Page Grid (2-Tier Bento Architecture)

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx:126-240`

**Interfaces:**
- Consumes: `HeroMetricCard`, `BentoStatCard`, `AnalyticBarChart`, `RecentActivityCard`, `filteredFefo`.
- Produces: 2-Tier Bento Grid where Row 1 pairs Hero (5 cols) + Bento Stats (7 cols), Row 2 pairs Chart (5 cols) + Activity Feed (7 cols), and Row 3 presents the FEFO Priority Table (12 cols).

- [x] **Step 1: Implement Tier 1 (Hero Metric + 2x2 Bento Stats)**
  In `src/app/(dashboard)/dashboard/page.tsx`:
  - Create a 12-column grid row:
    ```tsx
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
      {/* Left: Hero Metric Card (5 cols) */}
      <div className="lg:col-span-5 flex flex-col">
        <HeroMetricCard ... />
      </div>

      {/* Right: 2x2 Bento Stat Cards (7 cols) */}
      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BentoStatCard variant="gradient-urgent" ... />
        <BentoStatCard title="Stok Aman" ... />
        <BentoStatCard title="Penyaluran Hari Ini" ... />
        <BentoStatCard title="Donatur Aktif" ... />
      </div>
    </div>
    ```
  - Both sides achieve a balanced natural height of ~340px, ending at the exact same horizontal baseline with zero dead space.

- [x] **Step 2: Implement Tier 2 (Analytic Bar Chart + Recent Distribution Feed)**
  Create the middle 12-column grid row:
  ```tsx
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
    {/* Left: Analytic Bar Chart (5 cols) */}
    <div className="lg:col-span-5 flex flex-col">
      <AnalyticBarChart ... />
    </div>

    {/* Right: Recent Distribution Activity (7 cols) */}
    <div className="lg:col-span-7 flex flex-col">
      <RecentActivityCard activities={recentActivities} />
    </div>
  </div>
  ```
  This gives the distribution feed plenty of width for clean tabular columns (recipient name, driver badge, status, and packages), and gives the chart a generous ~480px width.

- [x] **Step 3: Implement Tier 3 (Full-Width FEFO Queue)**
  Keep the interactive FEFO Priority Queue table full-width (`12 cols`) as the anchor of the page.

- [x] **Step 4: Run full integration & smoke tests**
  Run: `npm.cmd test tests/e2e-smoke.test.ts tests/dashboard-stats.test.ts`
  Verify: All tests pass cleanly.

- [x] **Step 5: Commit dashboard page restructuring**
  Run:
  ```bash
  git add src/app/(dashboard)/dashboard/page.tsx
  git commit -m "feat(ui): implement 2-tier bento grid architecture pairing hero with stats and chart with activity"
  ```

---

### Task 6: Comprehensive Verification & Production Build Gate

**Files:**
- Test all components across light and dark modes.

- [x] **Step 1: Run complete Vitest suite**
  Run: `npm.cmd test`
  Verify: All 13 test suites and 92+ tests pass with 0 failures.

- [x] **Step 2: Run Production Build check**
  Run: `npm.cmd run build`
  Verify: Next.js compiles all pages with 0 errors and 0 type warnings.

- [x] **Step 3: Visual inspection verification**
  - Verify that typography is 100% sans-serif across all elements.
  - Verify that "Tren Logistik Pangan" does not wrap on desktop viewports.
  - Verify that the Sunday bar ("Min") is fully visible with generous margins.
  - Verify that no awkward black voids exist inside the Hero Metric Card.
  - Verify that Tier 1 (Hero + Stats) and Tier 2 (Chart + Feed) align horizontally with perfect symmetry.
  - Verify that active dock icons display clean integrated highlights.

- [x] **Step 4: Final commit**
  Run:
  ```bash
  git commit --allow-empty -m "chore: complete vertix ui 2-tier bento polish verification"
  ```
