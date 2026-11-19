# SisaBerkah Vertix UI Perfectionist Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the SisaBerkah FEFO dashboard into a pixel-perfect, modern SaaS interface (Vertix V14 style) by eliminating all serif typography artifacts, balancing the Bento Grid into an equalized 3-Column (4-4-4) layout, eliminating dead space voids, and fixing all text wrapping and chart clipping bugs while preserving all existing food safety invariants and test suites.

**Architecture:** Next.js 15 App Router with React 19, TypeScript, Tailwind CSS (`darkMode: 'class'`), Lucide React, and Framer Motion. Rebalance the dashboard grid into 3 balanced columns (`lg:col-span-4` each) for top-tier metrics, followed by a dedicated wide activity feed and the FEFO priority queue. Restore modern sans-serif typography across the global design system.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Framer Motion, Vitest.

**Spec Reference:** [docs/superpowers/specs/2026-11-17-vertix-ui-redesign-design.md](file:///d:/Sisa%20berkah/docs/superpowers/specs/2026-11-17-vertix-ui-redesign-design.md)

---

## Global Constraints

- **Platform:** Windows (Always invoke `npm.cmd` rather than `npm` to avoid PowerShell script execution blocks).
- **Typography:** Strictly prohibit serif/Times New Roman across the application canvas. Use the clean modern sans-serif stack (`font-sans`) with tabular figures (`tabular-nums`) for numeric data.
- **Unit Segregation Invariant:** Never sum quantities across mismatched units (e.g. porsi vs kg). Display secondary units as individual, segregated badge pills.
- **FEFO Priority Threshold:** Items with remaining shelf life $\le 24\text{ jam}$ must remain marked as `MENDEKATI_KEDALUWARSA` with urgent visual hierarchy.
- **Zero Test Regressions:** All 13 test suites and 92+ Vitest tests across the repository must remain passing at all times.

---

## Review Focus

1. **Zero Text Wrapping in Column 3:** "Tren Logistik Pangan" and "Penyelamatan vs Penyaluran" must stay on single lines without wrapping on standard desktop viewports ($\ge 1024\text{px}$).
2. **Zero Chart Clipping on Edge:** Sunday ("Min") dual-bars and labels must have $\ge 12\text{px}$ clearance from the right card border.
3. **No Dead Space in Hero Metric Card:** The vertical gap between the secondary unit pills and progress bar must not exceed $32\text{px}$, with action buttons remaining fully above the fold on $768\text{p}$ viewports.
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

- [ ] **Step 1: Inspect and remove serif overrides from `globals.css`**
  Remove lines 13–20 in `src/app/globals.css` that force:
  ```css
  html, body, input, button, select, textarea {
    font-family: 'Times New Roman', Times, serif;
  }
  ```
  Ensure `@layer base` configures `font-sans` with proper letter-spacing and font smoothing.

- [ ] **Step 2: Update `src/app/layout.tsx` root body class**
  Change line 16 from:
  ```tsx
  <body className="antialiased min-h-screen font-serif">{children}</body>
  ```
  to:
  ```tsx
  <body className="antialiased min-h-screen font-sans bg-[#f8fafc] dark:bg-[#0c0e12] text-slate-900 dark:text-zinc-100 selection:bg-emerald-500 selection:text-white">{children}</body>
  ```

- [ ] **Step 3: Run smoke test to verify no styling/runtime breakages**
  Run: `npm.cmd test tests/e2e-smoke.test.ts`
  Verify: Tests pass with 0 errors.

- [ ] **Step 4: Commit typography changes**
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

- [ ] **Step 1: Refactor active indicator on nav items**
  In `src/components/layout/floating-dock.tsx`, remove the awkward protruding sliver:
  ```tsx
  {active && (
    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-4 rounded-r-full bg-emerald-500 dark:bg-emerald-400" />
  )}
  ```
  Replace with a sleek integrated active style:
  - Active background: `bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-md`
  - Subtle glowing emerald dot or ring inside the button to signify active state cleanly without border overflows.

- [ ] **Step 2: Fix dock vertical spacing and separators**
  - Replace `my-auto` on `<nav>` with a structured flex layout: `flex flex-col items-center gap-2.5 py-2 w-full`.
  - Replace arbitrary thin divider (`w-7 h-[1px]`) with a refined micro-divider (`w-8 h-[1px] bg-slate-200/80 dark:bg-zinc-800`).
  - Add safe margin at top to ensure no overlap with Next.js development badges.

- [ ] **Step 3: Run theme and smoke tests**
  Run: `npm.cmd test tests/theme.test.ts tests/e2e-smoke.test.ts`
  Verify: All tests pass.

- [ ] **Step 4: Commit FloatingDock polish**
  Run:
  ```bash
  git add src/components/layout/floating-dock.tsx
  git commit -m "fix(ui): polish floating dock active indicators and vertical rhythm"
  ```

---

### Task 3: HeroMetricCard Micro-Spacing & Proximity Fixes

**Files:**
- Modify: `src/components/dashboard/hero-metric-card.tsx:58-175`

**Interfaces:**
- Consumes: `totalPorsi`, `totalKg`, `unitBreakdown`, `selectedUnit`, `onSelectUnit`.
- Produces: Compact hero card with zero dead space, perfect number baseline alignment, and clean secondary unit pills.

- [ ] **Step 1: Tighten vertical spacing and remove artificial stretching**
  - Remove excessive vertical stretching (`justify-between` with uncontrolled height).
  - Use structured section spacing:
    - Top header & unit filter: `mb-3`
    - Value & Unit display: `my-2` with `tabular-nums` and aligned font weights.
    - Secondary units: `flex flex-wrap items-center gap-1.5 mt-2.5`. Ensure all pills share uniform height (`h-6`) and padding (`px-2.5 py-0.5`).
    - Monthly progress bar: `my-4` with enhanced label contrast (`text-slate-700 dark:text-zinc-300`).
    - Quick actions: `pt-2 gap-2.5` with clean button geometry.

- [ ] **Step 2: Improve optical alignment for value and label**
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

- [ ] **Step 3: Run tests to verify metric card rendering**
  Run: `npm.cmd test tests/e2e-smoke.test.ts`
  Verify: Tests pass.

- [ ] **Step 4: Commit HeroMetricCard refinements**
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
- Produces: Responsive bar chart with single-line header, non-clipped Sunday bars, and harmonious dark-mode colors.

- [ ] **Step 1: Fix header text wrapping**
  - Refactor header container to handle responsive widths:
    ```tsx
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shrink-0">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
            Tren Logistik Pangan
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium truncate">
            Penyelamatan vs Penyaluran
          </p>
        </div>
      </div>
      {/* Range switcher with compact pills */}
      ...
    </div>
    ```

- [ ] **Step 2: Adjust bar widths and horizontal spacing to prevent clipping**
  - Change bar widths to `w-2 sm:w-2.5` with `gap-0.5 sm:gap-1`.
  - Add `px-2` padding inside the chart container so the rightmost Sunday ("Min") bars have ample breathing room ($\ge 12\text{px}$) from the card border.
  - Add `pt-1 pb-1` to the day labels so they do not touch the baseline divider.

- [ ] **Step 3: Soften dark-mode bar contrast**
  - Change Disalurkan bar from `dark:bg-white` to `dark:bg-emerald-200/90` or `dark:bg-slate-300` to eliminate visual glare and unify the palette.
  - Update legend dot to match.

- [ ] **Step 4: Run tests**
  Run: `npm.cmd test tests/e2e-smoke.test.ts`
  Verify: Tests pass.

- [ ] **Step 5: Commit AnalyticBarChart fixes**
  Run:
  ```bash
  git add src/components/dashboard/analytic-bar-chart.tsx
  git commit -m "fix(ui): prevent header wrapping, eliminate chart clipping, and tune bar contrast"
  ```

---

### Task 5: Rebalance Dashboard Page Grid (Balanced 4-4-4 Layout)

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx:126-240`

**Interfaces:**
- Consumes: `HeroMetricCard`, `BentoStatCard`, `AnalyticBarChart`, `RecentActivityCard`, `filteredFefo`.
- Produces: Perfectly balanced Bento Grid across 3 equal columns (4-4-4), followed by a dedicated wide activity feed and FEFO queue table.

- [ ] **Step 1: Reconfigure top bento grid into 3 balanced columns**
  In `src/app/(dashboard)/dashboard/page.tsx`:
  - **Column 1 (`lg:col-span-4`)**: `<HeroMetricCard />`
  - **Column 2 (`lg:col-span-4`)**: `2x2 BentoStatCard` grid (Prioritas FEFO, Stok Aman, Penyaluran Hari Ini, Donatur Aktif).
  - **Column 3 (`lg:col-span-4`)**: `<AnalyticBarChart />`
  - Remove `items-stretch` and allow each column to adopt its natural, compact height (~340px) seamlessly aligned.

- [ ] **Step 2: Relocate RecentActivityCard to a dedicated wide section**
  Mount `<RecentActivityCard />` directly beneath the 3-column bento row as a full or 2-column wide section:
  ```tsx
  {/* Activity & Logistical Feed Section */}
  <div className="w-full">
    <RecentActivityCard activities={recentActivities} />
  </div>
  ```
  This provides the distribution activity feed with generous horizontal space for recipient names, driver badges, status pills, and time stamps without cramped truncation.

- [ ] **Step 3: Run full integration & smoke tests**
  Run: `npm.cmd test tests/e2e-smoke.test.ts tests/dashboard-stats.test.ts`
  Verify: All tests pass cleanly.

- [ ] **Step 4: Commit dashboard page restructuring**
  Run:
  ```bash
  git add src/app/(dashboard)/dashboard/page.tsx
  git commit -m "feat(ui): rebalance dashboard bento grid into equalized 3-column 4-4-4 architecture"
  ```

---

### Task 6: Comprehensive Verification & Production Build Gate

**Files:**
- Test all components across light and dark modes.

- [ ] **Step 1: Run complete Vitest suite**
  Run: `npm.cmd test`
  Verify: All 13 test suites and 92+ tests pass with 0 failures.

- [ ] **Step 2: Run Production Build check**
  Run: `npm.cmd run build`
  Verify: Next.js compiles all pages with 0 errors and 0 type warnings.

- [ ] **Step 3: Visual inspection verification**
  - Verify that typography is 100% sans-serif across all elements.
  - Verify that "Tren Logistik Pangan" does not wrap on desktop viewports.
  - Verify that the Sunday bar ("Min") is fully visible without clipping.
  - Verify that no awkward black voids exist inside the Hero Metric Card.
  - Verify that active dock icons display clean integrated highlights.

- [ ] **Step 4: Final commit**
  Run:
  ```bash
  git commit --allow-empty -m "chore: complete vertix ui perfectionist polish verification"
  ```
