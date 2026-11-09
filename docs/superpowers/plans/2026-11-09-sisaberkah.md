# SisaBerkah Food Bank Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete **SisaBerkah** Food Bank Management web application, featuring role-based access for Admin and Relawan, inbound physical food inspection, real-time FEFO (*First Expired, First Out*) inventory prioritization, multi-item distribution logistics, segregated unit reporting, and audit logging.

**Architecture:** A monolithic Next.js App Router application with TypeScript and Tailwind CSS, backed by an embedded SQLite database managed via Prisma ORM. Session-based authentication handles RBAC, while server-side business services enforce stock invariants, dynamic expiry status computation, and transaction-safe distribution state transitions.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Prisma ORM, SQLite, Tailwind CSS, Lucide React, Vitest for unit/integration tests, bcryptjs for password hashing, and jsonwebtoken / session cookies for authentication.

**Spec:** [docs/superpowers/specs/2026-11-09-sisaberkah-design.md](file:///d:/Sisa%20berkah/docs/superpowers/specs/2026-11-09-sisaberkah-design.md)

---

## Global Constraints

- Platform: Windows (Node.js v26.3.0, npm.cmd v11.16.0).
- Database: Embedded SQLite (`prisma/dev.db`) using Prisma ORM.
- RBAC: Two roles strictly enforced (`ADMIN` and `RELAWAN`).
- Food Safety: Makanan dengan `physicalStatus = 'DITOLAK'` atau `expiryStatus = 'KEDALUWARSA'` tidak boleh dapat didistribusikan.
- Stock Mathematics: Koreksi jumlah awal tidak boleh lebih rendah dari jumlah yang sudah disalurkan ($\text{new\_initialQuantity} \ge \text{total\_disalurkan}$).
- Reporting: Rekap makanan terselamatkan hanya menghitung distribusi `DITERIMA` dan wajib dipisah per satuan (tidak boleh menjumlahkan silang kg dengan porsi).

---

## Review Focus

1. **Simultaneous distribution scheduling overcommitting remaining stock**: When two schedules request items from the same batch, available stock must account for existing `TERJADWAL` reservations so stock cannot drop below 0.
2. **Food expiring while waiting in `TERJADWAL` status**: Attempting to move a scheduled distribution to `DIKIRIM` when an item has expired must be rejected by server validation.
3. **Cross-unit addition in reports**: Summing quantities across mismatched units (e.g., 5 kg + 10 porsi = 15) must be prevented by grouping aggregates strictly by `unit`.
4. **Negative remaining stock during stock correction**: An Admin trying to correct `initialQuantity` to a value lower than what has already been distributed must receive an explicit HTTP 400 validation error.
5. **Rejected inbound food entering distribution**: Inbound food with any failed physical inspection checklist item must have `remainingQuantity = 0` and be blocked from selection.

---

## File Structure & Module Map

```
prisma/
  schema.prisma                    # Database models and relations
  seed.ts                          # Initial admin user, relawan, and test data
src/
  lib/
    db.ts                          # Singleton Prisma client instance
    auth.ts                        # Password hashing and JWT session management
    fefo.ts                        # Dynamic on-read expiry calculation logic
  services/
    auth.service.ts                # User registration, login, profile management
    donor.service.ts               # Donor CRUD, search, and soft-delete
    beneficiary.service.ts         # Beneficiary CRUD and read-only listing
    food.service.ts                # Inbound recording, inspection checklist, FEFO query, stock correction, disposal
    distribution.service.ts        # Scheduling, multi-item reservation, lifecycle transitions, history
    report.service.ts              # Rescued food aggregation (grouped by unit), donor report, CSV generation
    audit.service.ts               # Audit trail recording and retrieval
  app/
    api/                           # Next.js Route Handlers for API operations
    (auth)/login/                  # Login interface
    (dashboard)/                   # Protected application views
      layout.tsx                   # Responsive sidebar/navbar with RBAC navigation
      dashboard/                   # Real-time FEFO Dashboard & alerts
      makanan/masuk/               # Inbound donation intake & physical checklist
      makanan/kelola/              # Stock correction & disposal actions
      distribusi/                  # Distribution management & field status updater
      distribusi/buat/             # Multi-item distribution scheduler with FEFO picker
      donatur/                     # Donor directory & management
      penerima/                    # Beneficiary directory
      pengguna/                    # User account management (Admin only)
      laporan/                     # Rescued food metrics, donor report, audit log & CSV export
tests/
  fefo.test.ts                     # Dynamic expiry calculation unit tests
  food.service.test.ts             # Food intake and stock correction invariant tests
  distribution.service.test.ts     # Multi-item scheduling and status transition tests
  report.service.test.ts           # Grouped-by-unit report aggregation tests
```

---

## Task Decomposition

### Task 1: Next.js Project Scaffolding & Prisma SQLite Setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts`
- Test: `tests/setup.test.ts`

**Interfaces:**
- Produces: `prisma: PrismaClient` singleton exported from `src/lib/db.ts`.

- [ ] **Step 1: Write test to verify Prisma client connection and seed verification**

Create `tests/setup.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/lib/db';

describe('Database Setup & Seed', () => {
  it('should connect to SQLite database and query admin user', async () => {
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@sisaberkah.org' },
    });
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe('ADMIN');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run tests/setup.test.ts`  
Expected: FAIL (files and modules not found).

- [ ] **Step 3: Initialize Next.js project and configure Prisma with SQLite**

1. Initialize Next.js with TypeScript and Tailwind CSS in `d:\Sisa berkah`.
2. Install dependencies: `prisma`, `@prisma/client`, `bcryptjs`, `@types/bcryptjs`, `jsonwebtoken`, `@types/jsonwebtoken`, `lucide-react`, `vitest`.
3. Configure `prisma/schema.prisma` with models: `User`, `Donor`, `Beneficiary`, `FoodStock`, `Distribution`, `DistributionItem`, `AuditLog`.
4. Implement `prisma/seed.ts` seeding:
   - Admin account: `admin@sisaberkah.org` (password: `admin123`, role: `ADMIN`)
   - Relawan account: `relawan@sisaberkah.org` (password: `relawan123`, role: `RELAWAN`)
   - Initial sample donors and beneficiaries.
5. Implement `src/lib/db.ts` providing singleton `prisma`.
6. Run `npx.cmd prisma db push` and `npx.cmd prisma db seed`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run tests/setup.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold next.js app with prisma sqlite schema and seed"
```

---

### Task 2: Authentication & RBAC Services (US-01, US-02)

**Files:**
- Create: `src/lib/auth.ts`, `src/services/auth.service.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/users/route.ts`
- Test: `tests/auth.test.ts`

**Interfaces:**
- Consumes: `prisma` from `src/lib/db.ts`.
- Produces: 
  - `hashPassword(password: string): Promise<string>`
  - `verifyPassword(password: string, hash: string): Promise<boolean>`
  - `createSessionToken(user: { id: string; email: string; role: Role }): string`
  - `verifySessionToken(token: string): SessionPayload | null`
  - `loginUser(email: string, password: string): Promise<{ token: string; user: SafeUser }>`
  - `manageUsers: { create, list, toggleStatus, update }`

- [ ] **Step 1: Write tests for authentication and user deactivation rules**

Create `tests/auth.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { loginUser, createUser, toggleUserActive } from '../src/services/auth.service';

describe('Auth Service (US-01, US-02)', () => {
  it('should reject invalid password', async () => {
    await expect(loginUser('admin@sisaberkah.org', 'wrongpass')).rejects.toThrow('Kredensial tidak valid');
  });

  it('should authenticate valid credentials and return user role', async () => {
    const result = await loginUser('admin@sisaberkah.org', 'admin123');
    expect(result.user.role).toBe('ADMIN');
    expect(result.token).toBeDefined();
  });

  it('should block deactivated accounts from logging in', async () => {
    const newUser = await createUser({
      email: 'test_inactive@sisaberkah.org',
      name: 'Test Inactive',
      password: 'password123',
      role: 'RELAWAN',
    });
    await toggleUserActive(newUser.id, false);
    await expect(loginUser('test_inactive@sisaberkah.org', 'password123')).rejects.toThrow('Akun Anda dinonaktifkan');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run tests/auth.test.ts`  
Expected: FAIL (`loginUser` / `createUser` not defined).

- [ ] **Step 3: Implement Auth Service and API routes**

1. Implement `src/lib/auth.ts` with bcrypt hashing and JWT generation/verification with cookie support.
2. Implement `src/services/auth.service.ts`:
   - `loginUser(email, password)`: checks active status, verifies password, generates token.
   - `createUser({ email, name, password, role })`: hashes password, ensures unique email.
   - `toggleUserActive(userId, isActive)`: updates user status.
3. Implement API route handlers: `/api/auth/login`, `/api/auth/logout`, `/api/users`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run tests/auth.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/services/auth.service.ts src/app/api/auth/ tests/auth.test.ts
git commit -m "feat: implement authentication and rbac user management"
```

---

### Task 3: Master Data Management - Donors & Beneficiaries (US-03, US-04, US-05, US-06)

**Files:**
- Create: `src/services/donor.service.ts`, `src/services/beneficiary.service.ts`, `src/app/api/donors/route.ts`, `src/app/api/beneficiaries/route.ts`
- Test: `tests/master-data.test.ts`

**Interfaces:**
- Consumes: `prisma` from `src/lib/db.ts`.
- Produces:
  - `donorService.list({ search?, type?, page?, limit? })`
  - `donorService.create(data)`
  - `donorService.update(id, data)`
  - `donorService.softDelete(id)`
  - `beneficiaryService.list({ search?, type?, page?, limit? })`
  - `beneficiaryService.create(data, userRole)`
  - `beneficiaryService.update(id, data, userRole)`

- [ ] **Step 1: Write master data tests (soft delete and role protection)**

Create `tests/master-data.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { donorService } from '../src/services/donor.service';
import { beneficiaryService } from '../src/services/beneficiary.service';

describe('Master Data Service (US-03, US-04, US-05, US-06)', () => {
  it('should soft delete donor and exclude it from standard listings', async () => {
    const donor = await donorService.create({
      name: 'Bakery Lestari',
      type: 'RESTORAN',
      contact: '08123456789',
    });
    await donorService.softDelete(donor.id);
    const list = await donorService.list({ search: 'Bakery Lestari' });
    expect(list.data.find(d => d.id === donor.id)).toBeUndefined();
  });

  it('should reject beneficiary modification when performed by RELAWAN', async () => {
    await expect(
      beneficiaryService.create({
        name: 'Panti Asuhan Kasih',
        type: 'PANTI_ASUHAN',
        contact: '08987654321',
        address: 'Jl. Merdeka No. 1',
      }, 'RELAWAN')
    ).rejects.toThrow('Hanya Admin yang dapat mengelola data penerima');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run tests/master-data.test.ts`  
Expected: FAIL (`donorService` / `beneficiaryService` not defined).

- [ ] **Step 3: Implement Donor and Beneficiary services with API routes**

1. Implement `donorService`:
   - `list`: filters by `isDeleted: false`, handles pagination and regex/contains search for name and category.
   - `create` & `update`: validates mandatory fields.
   - `softDelete`: sets `isDeleted: true`.
2. Implement `beneficiaryService`:
   - Checks `userRole === 'ADMIN'` for mutations, permits read-only listing for `RELAWAN`.
3. Implement API route handlers `/api/donors` and `/api/beneficiaries`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run tests/master-data.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/donor.service.ts src/services/beneficiary.service.ts src/app/api/donors/ src/app/api/beneficiaries/ tests/master-data.test.ts
git commit -m "feat: implement donor and beneficiary master data management"
```

---

### Task 4: Inbound Food Intake & Physical Validation Checklist (US-07, US-08)

**Files:**
- Create: `src/services/food.service.ts`, `src/app/api/food/inbound/route.ts`
- Test: `tests/food-intake.test.ts`

**Interfaces:**
- Consumes: `prisma` from `src/lib/db.ts`.
- Produces:
  - `foodService.recordInbound(data: InboundFoodInput, userId: string): Promise<FoodStock>`

- [ ] **Step 1: Write test for physical inspection checklist and rejected stock zeroing**

Create `tests/food-intake.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { foodService } from '../src/services/food.service';
import { prisma } from '../src/lib/db';

describe('Inbound Food Intake & Physical Checklist (US-07, US-08)', () => {
  it('should set physicalStatus DITERIMA and remainingQuantity = initialQuantity when all checklist items pass', async () => {
    const donor = await prisma.donor.findFirst();
    const admin = await prisma.user.findFirst();
    const food = await foodService.recordInbound({
      donorId: donor!.id,
      name: 'Roti Gandum',
      quantity: 50,
      unit: 'kotak',
      expiryAt: new Date(Date.now() + 48 * 3600 * 1000),
      packagingIntact: true,
      temperatureSafe: true,
      visualSmellOk: true,
    }, admin!.id);

    expect(food.physicalStatus).toBe('DITERIMA');
    expect(food.remainingQuantity).toBe(50);
  });

  it('should set physicalStatus DITOLAK and remainingQuantity = 0 if any checklist item fails', async () => {
    const donor = await prisma.donor.findFirst();
    const admin = await prisma.user.findFirst();
    const food = await foodService.recordInbound({
      donorId: donor!.id,
      name: 'Susu UHT',
      quantity: 20,
      unit: 'kotak',
      expiryAt: new Date(Date.now() + 48 * 3600 * 1000),
      packagingIntact: false, // Rusak
      temperatureSafe: true,
      visualSmellOk: true,
    }, admin!.id);

    expect(food.physicalStatus).toBe('DITOLAK');
    expect(food.remainingQuantity).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run tests/food-intake.test.ts`  
Expected: FAIL (`foodService.recordInbound` not defined).

- [ ] **Step 3: Implement `recordInbound` in `src/services/food.service.ts`**

1. Calculate `isAccepted = packagingIntact && temperatureSafe && visualSmellOk`.
2. Set `physicalStatus = isAccepted ? 'DITERIMA' : 'DITOLAK'`.
3. Set `remainingQuantity = isAccepted ? quantity : 0`.
4. Persist `FoodStock` record and write intake entry to `AuditLog`.
5. Expose `/api/food/inbound` POST route.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run tests/food-intake.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/food.service.ts src/app/api/food/inbound/ tests/food-intake.test.ts
git commit -m "feat: implement inbound food intake and physical validation checklist"
```

---

### Task 5: FEFO Dynamic Shelf-Life Engine, Stock Correction & Disposal (US-09, US-10, US-11, US-12)

**Files:**
- Create: `src/lib/fefo.ts`, `src/app/api/food/fefo/route.ts`, `src/app/api/food/correct/route.ts`, `src/app/api/food/dispose/route.ts`
- Modify: `src/services/food.service.ts`
- Test: `tests/fefo.test.ts`

**Interfaces:**
- Produces:
  - `computeExpiryStatus(expiryAt: Date, physicalStatus: PhysicalStatus): ExpiryEvaluation`
  - `foodService.getFEFODashboard(): Promise<FEFOStockItem[]>`
  - `foodService.correctStock(stockId: string, newInitialQty: number, userId: string, role: string): Promise<FoodStock>`
  - `foodService.disposeStock(stockId: string, reason: string, userId: string): Promise<FoodStock>`

- [ ] **Step 1: Write tests for dynamic expiry evaluation and stock correction constraints**

Create `tests/fefo.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { computeExpiryStatus } from '../src/lib/fefo';
import { foodService } from '../src/services/food.service';
import { prisma } from '../src/lib/db';

describe('FEFO Engine & Stock Correction (US-09, US-10, US-11, US-12)', () => {
  it('should compute status correctly on read time', () => {
    const now = Date.now();
    expect(computeExpiryStatus(new Date(now + 36 * 3600 * 1000), 'DITERIMA').status).toBe('AMAN');
    expect(computeExpiryStatus(new Date(now + 12 * 3600 * 1000), 'DITERIMA').status).toBe('MENDEKATI_KEDALUWARSA');
    expect(computeExpiryStatus(new Date(now - 1000), 'DITERIMA').status).toBe('KEDALUWARSA');
    expect(computeExpiryStatus(new Date(now + 48 * 3600 * 1000), 'DITOLAK').status).toBe('DITOLAK');
  });

  it('should block stock correction below already-distributed amount (US-09)', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const stock = await prisma.foodStock.create({
      data: {
        donorId: (await prisma.donor.findFirst())!.id,
        name: 'Nasi Kotak Ayam',
        initialQuantity: 100,
        remainingQuantity: 60, // 40 already distributed
        unit: 'porsi',
        expiryAt: new Date(Date.now() + 48 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin!.id,
      },
    });

    // Attempting to correct to 30 (which is less than total_disalurkan = 40) must fail
    await expect(
      foodService.correctStock(stock.id, 30, admin!.id, 'ADMIN')
    ).rejects.toThrow('Jumlah baru tidak boleh lebih kecil dari jumlah yang sudah disalurkan');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run tests/fefo.test.ts`  
Expected: FAIL (`computeExpiryStatus` not defined).

- [ ] **Step 3: Implement FEFO calculation, stock correction, and disposal services**

1. Implement `src/lib/fefo.ts` with `computeExpiryStatus` returning `{ status, label, badge, canDistribute }`.
2. In `foodService`:
   - `getFEFODashboard()`: queries `FoodStock` where `remainingQuantity > 0`, `physicalStatus = 'DITERIMA'`, `isDisposed = false`, ordered by `expiryAt ASC`. Attaches computed status to each item.
   - `correctStock(stockId, newInitialQty, userId, role)`: verifies `role === 'ADMIN'`. Computes `totalDisalurkan = initialQuantity - remainingQuantity`. Asserts `newInitialQty >= totalDisalurkan`. Updates `initialQuantity = newInitialQty` and `remainingQuantity = newInitialQty - totalDisalurkan`. Logs to `AuditLog`.
   - `disposeStock(stockId, reason, userId)`: sets `remainingQuantity = 0`, `isDisposed = true`, `disposalReason = reason`. Logs to `AuditLog`.
3. Create API routes: `/api/food/fefo`, `/api/food/correct`, `/api/food/dispose`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run tests/fefo.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fefo.ts src/services/food.service.ts src/app/api/food/ tests/fefo.test.ts
git commit -m "feat: implement fefo dynamic shelf-life engine, stock correction, and disposal"
```

---

### Task 6: Multi-Item Distribution Scheduling & Lifecycle (US-13, US-14, US-15, US-16)

**Files:**
- Create: `src/services/distribution.service.ts`, `src/app/api/distributions/route.ts`, `src/app/api/distributions/[id]/status/route.ts`, `src/app/api/distributions/history/[beneficiaryId]/route.ts`
- Test: `tests/distribution.test.ts`

**Interfaces:**
- Consumes: `prisma` from `src/lib/db.ts`, `computeExpiryStatus` from `src/lib/fefo.ts`.
- Produces:
  - `distributionService.createSchedule(data, userId)`
  - `distributionService.updateStatus(distributionId, newStatus, userId)`
  - `distributionService.getHistoryByBeneficiary(beneficiaryId)`

- [ ] **Step 1: Write tests for distribution lifecycle, stock deduction, and cancellation restore**

Create `tests/distribution.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { distributionService } from '../src/services/distribution.service';
import { prisma } from '../src/lib/db';

describe('Distribution Lifecycle & Stock Movements (US-13, US-14, US-15, US-16)', () => {
  it('should deduct stock on DIKIRIM and restore stock on DIBATALKAN', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const beneficiary = await prisma.beneficiary.findFirst();
    const stock = await prisma.foodStock.create({
      data: {
        donorId: (await prisma.donor.findFirst())!.id,
        name: 'Beras Premium',
        initialQuantity: 100,
        remainingQuantity: 100,
        unit: 'kg',
        expiryAt: new Date(Date.now() + 72 * 3600 * 1000),
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin!.id,
      },
    });

    // 1. Create schedule TERJADWAL
    const dist = await distributionService.createSchedule({
      beneficiaryId: beneficiary!.id,
      scheduledDate: new Date(),
      items: [{ foodStockId: stock.id, quantity: 40 }],
    }, admin!.id);

    expect(dist.status).toBe('TERJADWAL');

    // 2. Dispatch DIKIRIM -> stock must deduct to 60
    await distributionService.updateStatus(dist.id, 'DIKIRIM', admin!.id);
    let updatedStock = await prisma.foodStock.findUnique({ where: { id: stock.id } });
    expect(updatedStock?.remainingQuantity).toBe(60);

    // 3. Cancel DIBATALKAN -> stock must restore back to 100
    await distributionService.updateStatus(dist.id, 'DIBATALKAN', admin!.id);
    updatedStock = await prisma.foodStock.findUnique({ where: { id: stock.id } });
    expect(updatedStock?.remainingQuantity).toBe(100);
  });

  it('should block dispatch if any item has expired (Review Focus 2)', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const beneficiary = await prisma.beneficiary.findFirst();
    const expiredStock = await prisma.foodStock.create({
      data: {
        donorId: (await prisma.donor.findFirst())!.id,
        name: 'Kue Basah',
        initialQuantity: 20,
        remainingQuantity: 20,
        unit: 'kotak',
        expiryAt: new Date(Date.now() - 3600 * 1000), // Already expired
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        physicalStatus: 'DITERIMA',
        createdByUserId: admin!.id,
      },
    });

    const dist = await distributionService.createSchedule({
      beneficiaryId: beneficiary!.id,
      scheduledDate: new Date(),
      items: [{ foodStockId: expiredStock.id, quantity: 10 }],
    }, admin!.id);

    await expect(
      distributionService.updateStatus(dist.id, 'DIKIRIM', admin!.id)
    ).rejects.toThrow('tidak aman untuk dikirim karena telah kedaluwarsa');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run tests/distribution.test.ts`  
Expected: FAIL (`distributionService` not defined).

- [ ] **Step 3: Implement Distribution Service and API routes**

1. Implement `src/services/distribution.service.ts`:
   - `createSchedule`: validates item availability against `remainingQuantity` minus other `TERJADWAL` reservations. Blocks expired/rejected items. Creates `Distribution` and `DistributionItem` records.
   - `updateStatus`: validates state transitions (`TERJADWAL` $\rightarrow$ `DIKIRIM` $\rightarrow$ `DITERIMA` or `DIBATALKAN`).
     - On `DIKIRIM`: verifies no item has passed expiry date; decrements `remainingQuantity` inside a database transaction; sets `dispatchedByUserId`.
     - On `DITERIMA`: sets `deliveredByUserId`.
     - On `DIBATALKAN`: if previous state was `DIKIRIM`, increments `remainingQuantity` back inside a transaction.
     - Logs audit trail for status changes.
   - `getHistoryByBeneficiary`: queries distributions with items and personnel names.
2. Implement API routes: `/api/distributions`, `/api/distributions/[id]/status`, `/api/distributions/history/[beneficiaryId]`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run tests/distribution.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/distribution.service.ts src/app/api/distributions/ tests/distribution.test.ts
git commit -m "feat: implement distribution lifecycle, stock reservations, and history"
```

---

### Task 7: Rescued Food Reports, Audit Trail & CSV Export (US-17, US-18, US-19, US-20)

**Files:**
- Create: `src/services/report.service.ts`, `src/services/audit.service.ts`, `src/app/api/reports/rescued/route.ts`, `src/app/api/reports/donors/route.ts`, `src/app/api/reports/csv/route.ts`, `src/app/api/audit/route.ts`
- Test: `tests/report.test.ts`

**Interfaces:**
- Consumes: `prisma` from `src/lib/db.ts`.
- Produces:
  - `reportService.getRescuedFoodReport(startDate?: Date, endDate?: Date): Promise<GroupedRescuedMetrics[]>`
  - `reportService.getDonorTransparencyReport(): Promise<DonorReportItem[]>`
  - `reportService.exportReportToCSV(type: 'rescued' | 'donor', startDate?: Date, endDate?: Date): Promise<string>`
  - `auditService.getLogs(filters)`

- [ ] **Step 1: Write test for segregated unit aggregation and CSV generation**

Create `tests/report.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { reportService } from '../src/services/report.service';

describe('Reporting & Segregated Unit Aggregation (US-17, US-18, US-20)', () => {
  it('should return metrics strictly segregated per unit and never sum cross-unit', async () => {
    const report = await reportService.getRescuedFoodReport();
    // Verify results are an array of { unit: string, totalQuantity: number }
    for (const metric of report) {
      expect(typeof metric.unit).toBe('string');
      expect(typeof metric.totalQuantity).toBe('number');
    }
    // Verify no two entries have the same unit
    const units = report.map(r => r.unit);
    expect(new Set(units).size).toBe(units.length);
  });

  it('should generate valid CSV formatted content', async () => {
    const csv = await reportService.exportReportToCSV('rescued');
    expect(csv).toContain('Satuan,Total Makanan Terselamatkan');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run tests/report.test.ts`  
Expected: FAIL (`reportService` not defined).

- [ ] **Step 3: Implement Report and Audit services with CSV export API**

1. In `src/services/report.service.ts`:
   - `getRescuedFoodReport`: queries `DistributionItem` joined with `Distribution` where `status = 'DITERIMA'` and filters by date range. Performs `GROUP BY unit` using Prisma query or raw SQL, returning `{ unit, totalQuantity }`.
   - `getDonorTransparencyReport`: aggregates total quantity received and total distributed per donor.
   - `exportReportToCSV`: converts aggregated records into RFC 4180 compliant CSV string.
2. In `src/services/audit.service.ts`:
   - Query `AuditLog` joined with `User` with pagination and entity filter.
3. Expose API routes with appropriate CSV `Content-Type: text/csv` headers for downloads.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run tests/report.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/report.service.ts src/services/audit.service.ts src/app/api/reports/ src/app/api/audit/ tests/report.test.ts
git commit -m "feat: implement segregated reporting, audit log viewer, and csv export"
```

---

### Task 8: Complete Web UI - Dashboard, Operations & RBAC Layout

**Files:**
- Create:
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(dashboard)/layout.tsx`
  - `src/app/(dashboard)/dashboard/page.tsx`
  - `src/app/(dashboard)/makanan/masuk/page.tsx`
  - `src/app/(dashboard)/makanan/kelola/page.tsx`
  - `src/app/(dashboard)/distribusi/page.tsx`
  - `src/app/(dashboard)/distribusi/buat/page.tsx`
  - `src/app/(dashboard)/distribusi/riwayat/[id]/page.tsx`
  - `src/app/(dashboard)/donatur/page.tsx`
  - `src/app/(dashboard)/penerima/page.tsx`
  - `src/app/(dashboard)/pengguna/page.tsx`
  - `src/app/(dashboard)/laporan/page.tsx`
- Test: `tests/e2e-smoke.test.ts`

**Interfaces:**
- Consumes: All API endpoints created in Tasks 2 through 7.
- Produces: Complete, responsive UI for Admin and Relawan roles.

- [ ] **Step 1: Write smoke test verifying page routes render without throwing 500**

Create `tests/e2e-smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('UI Route Verification', () => {
  it('should define all critical view components', async () => {
    // Assert presence of pages and export default functions
    const DashboardPage = await import('../src/app/(dashboard)/dashboard/page');
    expect(DashboardPage.default).toBeDefined();

    const InboundPage = await import('../src/app/(dashboard)/makanan/masuk/page');
    expect(InboundPage.default).toBeDefined();

    const DistributePage = await import('../src/app/(dashboard)/distribusi/buat/page');
    expect(DistributePage.default).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run tests/e2e-smoke.test.ts`  
Expected: FAIL (page modules not found).

- [ ] **Step 3: Implement Web UI screens and responsive components**

1. `(dashboard)/layout.tsx`: Navigation bar and sidebar showing active user, role indicator, and role-filtered menu items.
2. `(auth)/login/page.tsx`: Clean login form with error feedback.
3. `(dashboard)/dashboard/page.tsx`: FEFO cards sorted by urgency, summary metric counters, color badges (🟢 Aman, 🟡 Mendekati, 🔴 Kedaluwarsa).
4. `(dashboard)/makanan/masuk/page.tsx`: Inbound intake form with Donor picker and 3-item physical checklist with live Diterima/Ditolak preview.
5. `(dashboard)/makanan/kelola/page.tsx`: Inventory stock list with Admin stock correction modal and "Catat Pembuangan" button.
6. `(dashboard)/distribusi/buat/page.tsx`: Multi-item distribution form with FEFO batch picker and stock validation.
7. `(dashboard)/distribusi/page.tsx`: Task tracker for Relawan with one-click status transitions (Terjadwal $\rightarrow$ Dikirim $\rightarrow$ Diterima $\rightarrow$ Dibatalkan).
8. `(dashboard)/donatur/page.tsx` & `(dashboard)/penerima/page.tsx`: Searchable directories with pagination and RBAC modals.
9. `(dashboard)/laporan/page.tsx`: Clean statistics charts/cards grouped strictly by unit, donor breakdown, and one-click CSV download.

- [ ] **Step 4: Run smoke test and full test suite**

Run: `npx.cmd vitest run`  
Expected: All tests in `tests/*.test.ts` PASS.

- [ ] **Step 5: Verify build production bundle**

Run: `npx.cmd next build`  
Expected: Build succeeds without TypeScript or bundling errors.

- [ ] **Step 6: Final Commit**

```bash
git add .
git commit -m "feat: complete web ui screens, navigation layout, and end-to-end integration"
```

---

