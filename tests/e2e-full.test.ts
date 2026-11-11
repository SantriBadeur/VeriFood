import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/db';
import { authService } from '../src/services/auth.service';
import { donorService } from '../src/services/donor.service';
import { beneficiaryService } from '../src/services/beneficiary.service';
import { foodService } from '../src/services/food.service';
import { distributionService } from '../src/services/distribution.service';
import { reportService } from '../src/services/report.service';
import { auditService } from '../src/services/audit.service';
import { computeExpiryStatus } from '../src/lib/fefo';

describe('SisaBerkah Comprehensive End-to-End System Integration', () => {
  let adminUser: any;
  let relawanUser: any;
  let testDonor: any;
  let testBeneficiary: any;
  let acceptedStock: any;
  let rejectedStock: any;
  let distributionRecord: any;

  // --- 1. AUTHENTICATION & RBAC ---
  describe('1. Authentication & Role-Based Access Control', () => {
    it('should authenticate Admin user with correct permissions', async () => {
      const login = await authService.login('admin@sisaberkah.org', 'admin123');
      expect(login.user.role).toBe('ADMIN');
      expect(login.token).toBeDefined();
      adminUser = login.user;
    });

    it('should authenticate Relawan user with correct permissions', async () => {
      const login = await authService.login('relawan@sisaberkah.org', 'relawan123');
      expect(login.user.role).toBe('RELAWAN');
      expect(login.token).toBeDefined();
      relawanUser = login.user;
    });

    it('should reject invalid credentials with a descriptive error', async () => {
      await expect(
        authService.login('admin@sisaberkah.org', 'wrongpassword')
      ).rejects.toThrow('Kredensial tidak valid');
    });

    it('should block login for deactivated accounts', async () => {
      const testEmail = `inactive_e2e_${Date.now()}@sisaberkah.org`;
      const user = await authService.createUser({
        email: testEmail,
        name: 'Deactivated User',
        password: 'password123',
        role: 'RELAWAN',
      });
      await authService.toggleActive(user.id, false);

      await expect(
        authService.login(testEmail, 'password123')
      ).rejects.toThrow('Akun Anda dinonaktifkan');
    });
  });

  // --- 2. MASTER DATA (DONOR & BENEFICIARY) ---
  describe('2. Master Data Management (Donatur & Penerima)', () => {
    it('should allow Admin to create, update, search, and soft-delete a donor', async () => {
      // Create
      testDonor = await donorService.create({
        name: `Resto Berkah E2E ${Date.now()}`,
        type: 'RESTORAN',
        contact: '081234567890',
        address: 'Jl. Surya No. 10',
      });
      expect(testDonor.id).toBeDefined();

      // Update
      const updated = await donorService.update(testDonor.id, {
        contact: '081299998888',
      });
      expect(updated.contact).toBe('081299998888');

      // Search
      const searchRes = await donorService.list({ search: testDonor.name });
      expect(searchRes.data.length).toBeGreaterThanOrEqual(1);

      // Soft delete
      await donorService.softDelete(testDonor.id);
      const afterDelete = await donorService.list({ search: testDonor.name });
      expect(afterDelete.data.find((d) => d.id === testDonor.id)).toBeUndefined();

      // Re-create active donor for subsequent food tests (type: SUPERMARKET)
      testDonor = await donorService.create({
        name: `Superindo E2E ${Date.now()}`,
        type: 'SUPERMARKET',
        contact: '085511223344',
      });
      expect(testDonor.id).toBeDefined();
    });

    it('should enforce read-only beneficiary listing for Relawan and full CRUD for Admin', async () => {
      // Admin creates beneficiary
      testBeneficiary = await beneficiaryService.create(
        {
          name: `Panti Asuhan Kasih E2E ${Date.now()}`,
          type: 'PANTI_ASUHAN',
          contact: '087788990011',
          address: 'Jl. Mawar No. 4',
        },
        'ADMIN',
        adminUser.id
      );
      expect(testBeneficiary.id).toBeDefined();

      // Relawan reading beneficiaries succeeds
      const listForRelawan = await beneficiaryService.list({ search: testBeneficiary.name });
      expect(listForRelawan.data.find((b) => b.id === testBeneficiary.id)).toBeDefined();

      // Relawan attempting update fails with RBAC error
      await expect(
        beneficiaryService.update(testBeneficiary.id, { name: 'Hacked Panti' }, 'RELAWAN')
      ).rejects.toThrow('Hanya Admin yang dapat mengelola data penerima');

      // Admin update succeeds
      const updatedBen = await beneficiaryService.update(
        testBeneficiary.id,
        { contact: '087788990099' },
        'ADMIN'
      );
      expect(updatedBen.contact).toBe('087788990099');
    });
  });

  // --- 3. INBOUND FOOD INTAKE & PHYSICAL INSPECTION ---
  describe('3. Food Intake, Physical Inspection & Stock Registration', () => {
    it('should accept inbound food and initialize remaining quantity when all 3 checks pass', async () => {
      const expiry = new Date(Date.now() + 48 * 3600 * 1000); // 48 jam ke depan
      acceptedStock = await foodService.recordInbound(
        {
          donorId: testDonor.id,
          name: 'Nasi Kotak Rendang Komplit',
          quantity: 100,
          unit: 'porsi',
          expiryAt: expiry,
          packagingIntact: true,
          temperatureSafe: true,
          visualSmellOk: true,
        },
        adminUser.id
      );

      expect(acceptedStock.physicalStatus).toBe('DITERIMA');
      expect(acceptedStock.remainingQuantity).toBe(100);
      expect(acceptedStock.initialQuantity).toBe(100);
    });

    it('should reject inbound food and set remaining quantity = 0 when physical check fails', async () => {
      const expiry = new Date(Date.now() + 24 * 3600 * 1000);
      rejectedStock = await foodService.recordInbound(
        {
          donorId: testDonor.id,
          name: 'Susu Pasteurisasi Rusak Segel',
          quantity: 25,
          unit: 'liter',
          expiryAt: expiry,
          packagingIntact: false, // Segel rusak
          temperatureSafe: true,
          visualSmellOk: true,
        },
        adminUser.id
      );

      expect(rejectedStock.physicalStatus).toBe('DITOLAK');
      expect(rejectedStock.remainingQuantity).toBe(0);
    });
  });

  // --- 4. FEFO CALCULATION & INVENTORY PRIORITIZATION ---
  describe('4. FEFO Priority & Shelf-Life Calculation Engine', () => {
    it('should correctly flag near-expiry, safe, and expired food items dynamically', () => {
      const safeDate = new Date(Date.now() + 72 * 3600 * 1000);
      const nearDate = new Date(Date.now() + 6 * 3600 * 1000);
      const expiredDate = new Date(Date.now() - 3600 * 1000);

      const safeCheck = computeExpiryStatus(safeDate, 'DITERIMA');
      expect(safeCheck.status).toBe('AMAN');
      expect(safeCheck.badge).toBe('green');
      expect(safeCheck.canDistribute).toBe(true);

      const nearCheck = computeExpiryStatus(nearDate, 'DITERIMA');
      expect(nearCheck.status).toBe('MENDEKATI_KEDALUWARSA');
      expect(nearCheck.badge).toBe('yellow');
      expect(nearCheck.canDistribute).toBe(true);

      const expiredCheck = computeExpiryStatus(expiredDate, 'DITERIMA');
      expect(expiredCheck.status).toBe('KEDALUWARSA');
      expect(expiredCheck.badge).toBe('red');
      expect(expiredCheck.canDistribute).toBe(false);
    });

    it('should return FEFO dashboard items sorted by earliest expiry first', async () => {
      const fefoItems = await foodService.getFEFODashboard();
      expect(Array.isArray(fefoItems)).toBe(true);

      // Verify ascending order of expiry dates
      for (let i = 0; i < fefoItems.length - 1; i++) {
        const curr = new Date(fefoItems[i].expiryAt).getTime();
        const next = new Date(fefoItems[i + 1].expiryAt).getTime();
        expect(curr).toBeLessThanOrEqual(next);
      }
    });
  });

  // --- 5. STOCK CORRECTION & DISPOSAL INVARIANTS ---
  describe('5. Stock Correction & Food Disposal Invariants', () => {
    it('should allow Admin to adjust stock upward and prevent adjustments below distributed count', async () => {
      // Increase initial qty from 100 to 120
      const corrected = await foodService.correctStock(
        acceptedStock.id,
        120,
        adminUser.id,
        'ADMIN'
      );
      expect(corrected.initialQuantity).toBe(120);
      expect(corrected.remainingQuantity).toBe(120);

      // Relawan is blocked from correcting stock
      await expect(
        foodService.correctStock(acceptedStock.id, 100, relawanUser.id, 'RELAWAN')
      ).rejects.toThrow('Hanya Admin yang dapat mengoreksi stok makanan');
    });

    it('should allow disposal of expired/damaged stock with mandatory audit reason', async () => {
      const disposalBatch = await prisma.foodStock.create({
        data: {
          donorId: testDonor.id,
          name: 'Buah Pisang Bonyok',
          initialQuantity: 15,
          remainingQuantity: 15,
          unit: 'kg',
          expiryAt: new Date(Date.now() + 24 * 3600 * 1000),
          packagingIntact: true,
          temperatureSafe: true,
          visualSmellOk: true,
          physicalStatus: 'DITERIMA',
          createdByUserId: adminUser.id,
        },
      });

      const disposed = await foodService.disposeStock(
        disposalBatch.id,
        'Buah membusuk di gudang karena suhu ruangan',
        adminUser.id
      );

      expect(disposed.remainingQuantity).toBe(0);
      expect(disposed.disposalReason).toContain('suhu ruangan');
    });
  });

  // --- 6. DISTRIBUTION LIFECYCLE & MULTI-ITEM LOGISTICS ---
  describe('6. Distribution Lifecycle: TERJADWAL -> DIKIRIM -> DITERIMA', () => {
    it('should create distribution schedule and validate remaining stock reservation', async () => {
      distributionRecord = await distributionService.createSchedule(
        {
          beneficiaryId: testBeneficiary.id,
          scheduledDate: new Date(),
          notes: 'Pengiriman makan siang santri',
          items: [{ foodStockId: acceptedStock.id, quantity: 50 }],
        },
        adminUser.id
      );

      expect(distributionRecord.status).toBe('TERJADWAL');
      expect(distributionRecord.items.length).toBe(1);
      expect(distributionRecord.items[0].quantity).toBe(50);
    });

    it('should reject schedule overcommitting stock beyond remaining amount', async () => {
      // acceptedStock has 120 total, 50 reserved in TERJADWAL. Remaining uncommitted: 70.
      // Trying to schedule 80 must throw stock insufficient error
      await expect(
        distributionService.createSchedule(
          {
            beneficiaryId: testBeneficiary.id,
            scheduledDate: new Date(),
            items: [{ foodStockId: acceptedStock.id, quantity: 80 }],
          },
          adminUser.id
        )
      ).rejects.toThrow();
    });

    it('should transition to DIKIRIM and deduct physical stock', async () => {
      const dispatched = await distributionService.updateStatus(
        distributionRecord.id,
        'DIKIRIM',
        relawanUser.id
      );
      expect(dispatched?.status).toBe('DIKIRIM');

      const stockAfterDispatch = await prisma.foodStock.findUnique({
        where: { id: acceptedStock.id },
      });
      // 120 initial - 50 delivered = 70 remaining
      expect(stockAfterDispatch?.remainingQuantity).toBe(70);
    });

    it('should prevent stock correction below the 50 items already dispatched', async () => {
      // 50 has been distributed, trying to set initialQuantity to 40 (< 50) must throw
      await expect(
        foodService.correctStock(acceptedStock.id, 40, adminUser.id, 'ADMIN')
      ).rejects.toThrow('Jumlah baru tidak boleh lebih kecil dari jumlah yang sudah disalurkan');
    });

    it('should transition to DITERIMA when delivery is confirmed', async () => {
      const completed = await distributionService.updateStatus(
        distributionRecord.id,
        'DITERIMA',
        relawanUser.id
      );
      expect(completed?.status).toBe('DITERIMA');
    });

    it('should properly restore stock if a distribution is DIBATALKAN', async () => {
      const cancelDist = await distributionService.createSchedule(
        {
          beneficiaryId: testBeneficiary.id,
          scheduledDate: new Date(),
          items: [{ foodStockId: acceptedStock.id, quantity: 20 }],
        },
        adminUser.id
      );

      // Dispatch -> remaining goes from 70 to 50
      await distributionService.updateStatus(cancelDist.id, 'DIKIRIM', relawanUser.id);
      let stock = await prisma.foodStock.findUnique({ where: { id: acceptedStock.id } });
      expect(stock?.remainingQuantity).toBe(50);

      // Cancel -> remaining restored from 50 to 70
      await distributionService.updateStatus(cancelDist.id, 'DIBATALKAN', adminUser.id);
      stock = await prisma.foodStock.findUnique({ where: { id: acceptedStock.id } });
      expect(stock?.remainingQuantity).toBe(70);
    });
  });

  // --- 7. BENEFICIARY DISTRIBUTION HISTORY ---
  describe('7. Beneficiary Distribution History (US-16)', () => {
    it('should retrieve complete distribution history for beneficiary with delivered items', async () => {
      const history = await distributionService.getHistoryByBeneficiary(testBeneficiary.id);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(1);

      const completedEntry = history.find((d) => d.id === distributionRecord.id);
      expect(completedEntry).toBeDefined();
      expect(completedEntry?.status).toBe('DITERIMA');
      expect(completedEntry?.items[0].foodStock.name).toBe('Nasi Kotak Rendang Komplit');
    });
  });

  // --- 8. REPORTING & METRICS SEGREGATION ---
  describe('8. Reporting & Metric Segregation per Unit (US-17, US-18, US-19, US-20)', () => {
    it('should segregate rescued food report strictly by unit and never sum cross-unit', async () => {
      const rescuedReport = await reportService.getRescuedFoodReport();
      expect(Array.isArray(rescuedReport)).toBe(true);

      const porsiGroup = rescuedReport.find((r) => r.unit === 'porsi');
      expect(porsiGroup).toBeDefined();
      expect(porsiGroup!.totalQuantity).toBeGreaterThanOrEqual(50);

      // Units must be distinct
      const units = rescuedReport.map((r) => r.unit);
      expect(new Set(units).size).toBe(units.length);
    });

    it('should generate donor contribution reports with distinct metrics', async () => {
      const donorReport = await reportService.getDonorTransparencyReport();
      expect(Array.isArray(donorReport)).toBe(true);

      const donorEntry = donorReport.find((d) => d.donorId === testDonor.id);
      expect(donorEntry).toBeDefined();
      expect(donorEntry?.totalReceived).toBeGreaterThanOrEqual(100);
      expect(donorEntry?.totalDistributed).toBeGreaterThanOrEqual(50);
    });

    it('should generate valid RFC-compliant CSV for rescued food and donors', async () => {
      const rescuedCsv = await reportService.exportReportToCSV('rescued');
      expect(rescuedCsv).toContain('Satuan,Total Makanan Terselamatkan');
      expect(rescuedCsv).toContain('porsi');

      const donorCsv = await reportService.exportReportToCSV('donor');
      expect(donorCsv).toContain('Nama Donatur,Kategori,Satuan');
    });
  });

  // --- 9. AUDIT LOGGING & USER MANAGEMENT ---
  describe('9. Audit Trail & User Administration (US-21, US-22)', () => {
    it('should record comprehensive audit trail for sensitive system actions', async () => {
      const logs = await auditService.getLogs({ limit: 50 });
      expect(logs.total).toBeGreaterThan(0);

      // Verify that audit log entries have all required properties
      const sampleLog = logs.data[0];
      expect(sampleLog.action).toBeDefined();
      expect(sampleLog.entity).toBeDefined();
      expect(sampleLog.createdAt).toBeDefined();
    });

    it('should allow Admin to manage users and view full user list', async () => {
      const users = await authService.listUsers();
      expect(users.length).toBeGreaterThanOrEqual(2);

      const hasAdmin = users.some((u) => u.role === 'ADMIN');
      const hasRelawan = users.some((u) => u.role === 'RELAWAN');
      expect(hasAdmin).toBe(true);
      expect(hasRelawan).toBe(true);
    });
  });
});
