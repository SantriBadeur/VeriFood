# SisaBerkah - System Design Document

**Date:** 2026-11-09  
**Status:** Approved by Builder Review (Ready for User Confirmation)  
**Author:** Pair Programming (User & AI)  

---

## 1. Executive Summary & Intent

### 1.1 Intent
**SisaBerkah** is a specialized web platform designed for Food Bank organizations. Its primary mission is to prevent edible food donations from being wasted by systematically managing incoming surplus food, ensuring strict food safety validations, prioritizing distribution via FEFO (*First Expired, First Out*), and tracking accountable multi-item deliveries to verified beneficiaries.

### 1.2 The "Why"
Surplus food from restaurants, catering, supermarkets, and individuals often has a very tight expiration window (hours to days). Without a dedicated system, food banks face critical operational risks:
1. Food rotting in storage because it wasn't tracked by expiration time.
2. Unfit or spoiled food accidentally entering distribution, threatening public health.
3. Lack of inventory transparency, causing stock discrepancies and inability to report rescued food metrics to donor partners.

SisaBerkah solves these problems through automated FEFO prioritization, dynamic real-time expiration calculation, intake physical condition checklists, and granular audit trails.

---

## 2. Goals, Non-Goals, and Anti-Goals

### 2.1 Goals
- **Strict Role-Based Access Control (RBAC)**: Clear operational division between **Admin** (master data, user management, stock correction, scheduling, audit, reports) and **Relawan** (inbound intake, physical condition checklists, distribution status updates in the field).
- **Physical Quality Gate**: Enforce physical inspection (packaging, temperature, visual appearance) upon receiving; rejected items immediately set remaining stock to 0 and never enter distributable stock.
- **Dynamic FEFO Prioritization**: Automatically calculate food shelf-life status (*Aman*, *Mendekati Kedaluwarsa* < 24h, *Kedaluwarsa*) dynamically on read time, sorting stock by ascending expiry date.
- **Safety Interlocks**: Strictly block expired or rejected food from being selected for distribution schedules, and block dispatch if food expires while in scheduled state.
- **Accountable Distribution Lifecycle**: Track distribution states (*Terjadwal* $\rightarrow$ *Dikirim* $\rightarrow$ *Diterima* / *Dibatalkan*) with automatic stock deduction and rollback on cancellation.
- **Auditable & Grouped Reporting**: Generate rescued food metrics grouped strictly per unit (e.g., kg, portions) without invalid cross-unit summation, donor transparency reports, and CSV exports with audit logging.

### 2.2 Non-Goals
- Direct public marketplace or consumer-facing mobile app for general public ordering.
- Financial transactions, delivery payments, or online payment gateway integrations.
- Automated IoT cold chain sensor hardware integration (inspections are entered manually via the physical checklist).

### 2.3 Anti-Goals
- **No Cross-Unit Summation**: Never add 10 kg with 20 portions into 30. Quantities must always stay segregated by unit.
- **No Negative Inventory**: Never allow stock corrections or distribution dispatch to drop inventory below zero or below what has already been distributed.
- **No Unaudited Mutating Actions**: No deletion or critical mutation of stock or distribution without logging user identity and timestamp.

---

## 3. Architecture & Technical Approaches

### 3.1 Approaches Considered

1. **Option 1: Fullstack Modern Monorepo (Next.js App Router + TypeScript + Tailwind CSS + SQLite via Prisma)**
   - *Architecture*: Unified React frontend and Node.js server actions/API in a single codebase. SQLite database stored locally as a single file.
   - *Pros*: Zero external database server configuration, fast development cycle, rich reactive UI for FEFO color cards and multi-item forms, mobile-responsive layout for field volunteers.
   - *Cons*: Coupled frontend and backend codebase.
   - *Status*: **SELECTED** (Ideal for rapid deployment, ease of local maintenance on Windows, and zero friction setup).

2. **Option 2: Decoupled REST Architecture (Python FastAPI + React Vite SPA + PostgreSQL)**
   - *Architecture*: Independent backend API service with Pydantic schemas and SQLAlchemy, paired with an independent SPA frontend.
   - *Pros*: Strict separation of concerns, native Swagger interactive documentation, ready for future native mobile apps.
   - *Cons*: Higher setup complexity, requires managing two runtime servers and configuring database services.
   - *Status*: Rejected in favor of the unified Next.js stack.

3. **Option 3: Traditional Server-Side Rendered (Express.js + EJS Templates + Bootstrap)**
   - *Architecture*: Traditional multi-page application with template rendering.
   - *Pros*: Low abstraction.
   - *Cons*: Cumbersome for dynamic multi-item distribution forms, live countdown badges, and interactive inspection checklists.
   - *Status*: Rejected due to poor dynamic user experience.

---

## 4. User Stories & Acceptance Criteria Traceability

The system fulfills all 20 specified User Stories:

| ID | Role | Feature | Acceptance Criteria & Technical Guarantee |
|---|---|---|---|
| **US-01** | Admin / Relawan | Login & RBAC | Invalid credentials rejected with clear error. Menu and API endpoints enforce role-based access. |
| **US-02** | Admin | User Management | Admin can create, edit, deactivate users. Unique email. Deactivated accounts blocked from authentication. Passwords hashed using bcrypt/argon2. |
| **US-03** | Admin | Donor Management | CRUD for donors (Restoran, Katering, Supermarket, Individu). Soft delete (`isDeleted = true`). |
| **US-04** | Admin / Relawan | Donor Search | Search by name or category with pagination and real-time filtering. |
| **US-05** | Admin | Beneficiary Management | CRUD for beneficiaries (Panti Asuhan, Komunitas, Keluarga Prasejahtera). Required fields: name, type, address, contact. |
| **US-06** | Relawan | View Beneficiaries | Read-only listing for volunteers. Modification endpoints strictly forbidden for Relawan role. |
| **US-07** | Relawan | Log Inbound Food | Record donor, food name, initial quantity, unit, expiry timestamp. Initial stock defaults to remaining stock. |
| **US-08** | Relawan | Physical Inspection Checklist | Packaging (intact/damaged), Temperature (safe/unsafe), Visual/Smell (fresh/suspicious). If any fails $\rightarrow$ Ditolak. Rejected items have remaining stock set to 0 and never enter distribution stock. |
| **US-09** | Admin | Stock Correction | Admin only. New quantity cannot be lower than the quantity already distributed. Change logged in audit trail. |
| **US-10** | System | Dynamic Expiry Status | Computed on read: `Aman` ($>24$h remaining), `Mendekati Kedaluwarsa` ($0 < \text{remaining} \le 24$h), `Kedaluwarsa` ($\le 0$). |
| **US-11** | Admin / Relawan | FEFO Dashboard | Sorted by ascending expiration date. Only displays remaining stock $> 0$. Green, yellow, red badges. Read-only for Relawan. |
| **US-12** | System | Block Unfit Distribution | Form validation and server-side rejection for any item with status `Kedaluwarsa` or `Ditolak`. Clear error message returned. |
| **US-13** | Admin | Distribution Scheduling | Select beneficiary, delivery date, optional assigned volunteer, initial status `Terjadwal`. |
| **US-14** | Admin | Multi-Item Distribution | Schedule can contain multiple food items with specified quantities from FEFO inventory picker. Requested quantity $\le$ available remaining stock. Stock deducted when status moves to `Dikirim`. |
| **US-15** | Relawan / Admin | Distribution Lifecycle | Valid state transitions: `Terjadwal` $\rightarrow$ `Dikirim` $\rightarrow$ `Diterima`. `Dibatalkan` restores remaining stock and logs event. System logs which volunteer dispatched/delivered. |
| **US-16** | Admin | Distribution History | Historical view per beneficiary displaying date, item list, quantities, final status, and assigned/delivered personnel. |
| **US-17** | Admin | Rescued Food Metrics | Aggregate sum of quantities where distribution status is `Diterima`. Strictly grouped per unit (e.g. Total kg, Total porsi). Cross-unit addition is blocked. |
| **US-18** | Admin | Donor Transparency Report | Report showing donations received per donor and the corresponding distributed amounts. |
| **US-19** | Admin | Audit Trail | Log table recording: Actor (`user_id`), Timestamp, Action Type, Entity (`Makanan`, `Distribusi`, `Donatur`), and serialized payload change. |
| **US-20** | Admin | CSV Export | Export filtered reporting metrics to downloadable CSV format. |

---

## 5. Domain Model & Database Schema

The database is structured using SQLite with Prisma ORM:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  RELAWAN
}

enum DonorType {
  RESTORAN
  KATERING
  SUPERMARKET
  INDIVIDU
}

enum BeneficiaryType {
  PANTI_ASUHAN
  KOMUNITAS
  KELUARGA_PRASEJAHTERA
}

enum PhysicalStatus {
  DITERIMA
  DITOLAK
}

enum DistributionStatus {
  TERJADWAL
  DIKIRIM
  DITERIMA
  DIBATALKAN
}

model User {
  id                    String         @id @default(uuid())
  email                 String         @unique
  name                  String
  passwordHash          String
  role                  Role           @default(RELAWAN)
  isActive              Boolean        @default(true)
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
  
  foodEntries           FoodStock[]    @relation("FoodCreatedBy")
  createdDistributions  Distribution[] @relation("DistributionCreatedBy")
  assignedDistributions Distribution[] @relation("DistributionAssignedTo")
  dispatchedDistributions Distribution[] @relation("DistributionDispatchedBy")
  deliveredDistributions  Distribution[] @relation("DistributionDeliveredBy")
  auditLogs             AuditLog[]
}

model Donor {
  id          String      @id @default(uuid())
  name        String
  type        DonorType
  contact     String
  address     String?
  isDeleted   Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  foods       FoodStock[]
}

model Beneficiary {
  id          String            @id @default(uuid())
  name        String
  type        BeneficiaryType
  contact     String
  address     String
  isDeleted   Boolean           @default(false)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  distributions Distribution[]
}

model FoodStock {
  id                 String             @id @default(uuid())
  donorId            String
  donor              Donor              @relation(fields: [donorId], references: [id])
  name               String
  initialQuantity    Float
  remainingQuantity  Float
  unit               String             // e.g., "porsi", "kg", "kotak"
  expiryAt           DateTime
  
  // Physical Validation Checklist (US-08)
  packagingIntact    Boolean            // true: Utuh, false: Rusak
  temperatureSafe    Boolean            // true: Sesuai, false: Tidak Sesuai
  visualSmellOk      Boolean            // true: Segar, false: Mencurigakan
  physicalStatus     PhysicalStatus     // DITERIMA or DITOLAK
  notes              String?
  
  // Disposal/Write-off (if expired in warehouse)
  isDisposed         Boolean            @default(false)
  disposalReason     String?
  disposedAt         DateTime?
  
  createdByUserId    String
  createdByUser      User               @relation("FoodCreatedBy", fields: [createdByUserId], references: [id])
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  
  distributionItems  DistributionItem[]
}

model Distribution {
  id                String             @id @default(uuid())
  beneficiaryId     String
  beneficiary       Beneficiary        @relation(fields: [beneficiaryId], references: [id])
  scheduledDate     DateTime
  status            DistributionStatus @default(TERJADWAL)
  notes             String?
  
  // Personnel Tracking (US-16)
  createdByUserId   String
  createdByUser     User               @relation("DistributionCreatedBy", fields: [createdByUserId], references: [id])
  assignedToUserId  String?            // Optional assigned volunteer
  assignedToUser    User?              @relation("DistributionAssignedTo", fields: [assignedToUserId], references: [id])
  dispatchedByUserId String?           // Volunteer/Admin who changed status to DIKIRIM
  dispatchedByUser  User?              @relation("DistributionDispatchedBy", fields: [dispatchedByUserId], references: [id])
  deliveredByUserId  String?           // Volunteer/Admin who changed status to DITERIMA
  deliveredByUser   User?              @relation("DistributionDeliveredBy", fields: [deliveredByUserId], references: [id])
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  items             DistributionItem[]
}

model DistributionItem {
  id              String       @id @default(uuid())
  distributionId  String
  distribution    Distribution @relation(fields: [distributionId], references: [id], onDelete: Cascade)
  foodStockId     String
  foodStock       FoodStock    @relation(fields: [foodStockId], references: [id])
  quantity        Float
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String   // e.g. "USER_LOGIN", "CREATE_STOCK", "CORRECT_STOCK", "STATUS_CHANGE", "DISPOSAL"
  entity     String   // "FoodStock", "Distribution", "Donor", "User"
  entityId   String
  details    String   // JSON string of differences or context
  createdAt  DateTime @default(now())
}
```

---

## 6. Business Logic, State Rules & Settled Builder Decisions

### 6.1 Expiration Status Evaluation (Computed on Read)
When querying or displaying food items, status is evaluated dynamically:
```typescript
export function computeExpiryStatus(expiryAt: Date, physicalStatus: 'DITERIMA' | 'DITOLAK') {
  if (physicalStatus === 'DITOLAK') {
    return { status: 'DITOLAK', label: 'Ditolak (Kondisi Tidak Layak)', badge: 'red', canDistribute: false };
  }
  const now = new Date();
  const diffHours = (expiryAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 0) {
    return { status: 'KEDALUWARSA', label: 'Kedaluwarsa', badge: 'red', canDistribute: false };
  } else if (diffHours <= 24) {
    return { status: 'MENDEKATI_KEDALUWARSA', label: 'Mendekati Kedaluwarsa (<24 jam)', badge: 'yellow', canDistribute: true };
  } else {
    return { status: 'AMAN', label: 'Aman', badge: 'green', canDistribute: true };
  }
}
```

### 6.2 Item Allocation in Distribution Creation (Builder Decision 1)
- **Mechanism**: **Manual Batch Selection from FEFO-Sorted Picker**.
- When Admin schedules a distribution, the multi-item selector displays available `FoodStock` batches sorted in ascending order of `expiryAt` (earliest expiration first).
- Batches with `canDistribute: false` (expired or rejected) are visually disabled and blocked by both UI and backend validation (US-12).
- Admin selects the batch and inputs the requested quantity. This gives the food bank full control to match specific foods and portions to beneficiary needs while honoring the FEFO recommendation.

### 6.3 Personnel Tracking in Distributions (Builder Decision 2)
- **Mechanism**: **Dual Support (Upfront Assignment + Dynamic Execution Claim)**.
- Admin can optionally assign a specific volunteer (`assignedToUserId`) during scheduling.
- If unassigned, any logged-in volunteer on duty can view and process the distribution.
- When status changes to `DIKIRIM`, the system records `dispatchedByUserId = session.user.id`.
- When status changes to `DITERIMA`, the system records `deliveredByUserId = session.user.id`.
- US-16 display: Shows assigned volunteer name and/or actual field delivery personnel.

### 6.4 Safety Guard on Scheduled Expiry (Builder Decision 3)
- If food expires while waiting in `TERJADWAL` status, transitioning to `DIKIRIM` is strictly blocked by the system with a warning: *"Item [Nama Makanan] telah melewati batas kedaluwarsa dan tidak aman untuk dikirim."*
- Admin can cancel the distribution or remove the expired item before dispatching.

### 6.5 Warehouse Spoilage Disposal (Builder Decision 4)
- When undistributed stock reaches expiration in storage, Admin has a dedicated **"Catat Pembuangan (Disposal)"** action in `/makanan/kelola`.
- Effect: Sets `isDisposed = true`, `remainingQuantity = 0`, logs `AuditLog` action `DISPOSAL_EXPIRED`.
- Crucially, `initialQuantity` remains untouched, ensuring US-18 (Donor Transparency Report) accurately reflects how much food was originally donated.

### 6.6 Rejected Inbound Items (Builder Decision 5)
- When an inbound donation fails the physical inspection checklist (US-08), its `physicalStatus = 'DITOLAK'` and its `remainingQuantity` is automatically set to `0`.
- Because `remainingQuantity == 0`, it does not appear on the active FEFO dashboard (US-11: only `remainingQuantity > 0`).
- It remains safely stored in the database for intake logs and donor audit records.

### 6.7 Stock Correction Invariant (US-09)
When Admin corrects `FoodStock.initialQuantity`:
$$\text{total\_disalurkan} = \text{initialQuantity} - \text{remainingQuantity}$$
$$\text{new\_initialQuantity} \ge \text{total\_disalurkan}$$
$$\text{new\_remainingQuantity} = \text{new\_initialQuantity} - \text{total\_disalurkan}$$
Any update failing this inequality is blocked with an explicit error.

---

## 7. User Interface & Screen Architecture

The UI layout utilizes Next.js App Router with responsive navigation:

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/                 # Login form (US-01)
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Responsive Sidebar/Navbar with role filtering
│   │   ├── page.tsx               # Redirects to /dashboard
│   │   ├── dashboard/             # FEFO Dashboard & Expiry Alerts (US-10, US-11)
│   │   ├── makanan/
│   │   │   ├── masuk/             # Inbound Food & Physical Inspection Form (US-07, US-08)
│   │   │   └── kelola/            # Stock correction & disposal action (US-09, US-12)
│   │   ├── distribusi/
│   │   │   ├── page.tsx           # Distribution list & status update buttons (US-15)
│   │   │   ├── buat/              # Create distribution schedule & FEFO picker (US-13, US-14)
│   │   │   └── riwayat/[id]/      # Beneficiary distribution history (US-16)
│   │   ├── donatur/               # Donor CRUD & search (US-03, US-04)
│   │   ├── penerima/              # Beneficiary CRUD & read-only view (US-05, US-06)
│   │   ├── pengguna/              # User management for Admin (US-02)
│   │   └── laporan/
│   │       ├── capaian/           # Rescued food metrics grouped by unit (US-17)
│   │       ├── donatur/           # Transparency report per donor (US-18)
│   │       └── audit/             # Audit trail & CSV export button (US-19, US-20)
```

---

## 8. What's Left to the Builder

The builder (implementation phase) will decide:
1. Exact Tailwind color scheme & card styling (e.g., emerald green, amber yellow, rose red).
2. Seed script data generator (default Admin account `admin@sisaberkah.org` and demo records).
3. Pagination limit defaults (10 items per page).
4. Interactive modal/toast notifications for feedback messages.

---
