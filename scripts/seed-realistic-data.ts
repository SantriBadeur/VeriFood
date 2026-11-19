import { PrismaClient, Role, DonorType, BeneficiaryType, PhysicalStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding clean, realistic data for SisaBerkah...');

  // 1. Ensure Users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const relawanPasswordHash = await bcrypt.hash('relawan123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sisaberkah.org' },
    update: {},
    create: {
      email: 'admin@sisaberkah.org',
      name: 'Administrator SisaBerkah',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const relawan = await prisma.user.upsert({
    where: { email: 'relawan@sisaberkah.org' },
    update: {},
    create: {
      email: 'relawan@sisaberkah.org',
      name: 'Thoriq Relawan',
      passwordHash: relawanPasswordHash,
      role: Role.RELAWAN,
      isActive: true,
    },
  });

  // 2. Ensure Donors
  const donor1 = await prisma.donor.upsert({
    where: { id: 'donor-1' },
    update: { name: 'Restoran Padang Sederhana' },
    create: {
      id: 'donor-1',
      name: 'Restoran Padang Sederhana',
      type: DonorType.RESTORAN,
      contact: '081234567890',
      address: 'Jl. Sudirman No. 10, Jakarta Pusat',
    },
  });

  const donor2 = await prisma.donor.upsert({
    where: { id: 'donor-2' },
    update: { name: 'Katering Berkah Rasa' },
    create: {
      id: 'donor-2',
      name: 'Katering Berkah Rasa',
      type: DonorType.KATERING,
      contact: '082345678901',
      address: 'Jl. Gatot Subroto No. 45, Jakarta Selatan',
    },
  });

  const donor3 = await prisma.donor.upsert({
    where: { id: 'donor-3' },
    update: { name: 'Supermarket Segar Jaya' },
    create: {
      id: 'donor-3',
      name: 'Supermarket Segar Jaya',
      type: DonorType.SUPERMARKET,
      contact: '083456789012',
      address: 'Jl. Thamrin No. 8, Jakarta Pusat',
    },
  });

  // 3. Ensure Beneficiaries
  const ben1 = await prisma.beneficiary.upsert({
    where: { id: 'ben-1' },
    update: { name: 'Panti Asuhan Kasih Ibu' },
    create: {
      id: 'ben-1',
      name: 'Panti Asuhan Kasih Ibu',
      type: BeneficiaryType.PANTI_ASUHAN,
      contact: '085678901234',
      address: 'Jl. Anggrek No. 12, Tebet',
    },
  });

  const ben2 = await prisma.beneficiary.upsert({
    where: { id: 'ben-2' },
    update: { name: 'Komunitas Dhuafa Sejahtera' },
    create: {
      id: 'ben-2',
      name: 'Komunitas Dhuafa Sejahtera',
      type: BeneficiaryType.KOMUNITAS,
      contact: '086789012345',
      address: 'Jl. Melati No. 5, Manggarai',
    },
  });

  // 4. Clean up old test duplicate food stocks
  await prisma.distributionItem.deleteMany({});
  await prisma.distribution.deleteMany({});
  await prisma.foodStock.deleteMany({});

  console.log('Cleaned up old stock records.');

  const now = new Date();

  // 5. Seed Varied, Realistic Food Batches
  const foodSamples = [
    // 🟡 PRIORITAS FEFO (Expiring soon: <= 24 hours)
    {
      name: 'Nasi Kotak Ayam Bakar Madu',
      donorId: donor1.id,
      initialQuantity: 40,
      remainingQuantity: 35,
      unit: 'porsi',
      expiryAt: new Date(now.getTime() + 6 * 3600 * 1000), // in 6 hours
      packagingIntact: true,
      temperatureSafe: true,
      visualSmellOk: true,
      physicalStatus: PhysicalStatus.DITERIMA,
      createdByUserId: relawan.id,
    },
    {
      name: 'Sandwich Telur & Sayur Segar',
      donorId: donor2.id,
      initialQuantity: 25,
      remainingQuantity: 20,
      unit: 'porsi',
      expiryAt: new Date(now.getTime() + 12 * 3600 * 1000), // in 12 hours
      packagingIntact: true,
      temperatureSafe: true,
      visualSmellOk: true,
      physicalStatus: PhysicalStatus.DITERIMA,
      createdByUserId: relawan.id,
    },
    // 🟢 STOK AMAN (> 24 hours)
    {
      name: 'Roti Gandum Utuh Premium',
      donorId: donor3.id,
      initialQuantity: 50,
      remainingQuantity: 50,
      unit: 'kotak',
      expiryAt: new Date(now.getTime() + 48 * 3600 * 1000), // in 48 hours
      packagingIntact: true,
      temperatureSafe: true,
      visualSmellOk: true,
      physicalStatus: PhysicalStatus.DITERIMA,
      createdByUserId: relawan.id,
    },
    {
      name: 'Apel Fuji Segar Manis',
      donorId: donor3.id,
      initialQuantity: 30,
      remainingQuantity: 30,
      unit: 'kg',
      expiryAt: new Date(now.getTime() + 72 * 3600 * 1000), // in 3 days
      packagingIntact: true,
      temperatureSafe: true,
      visualSmellOk: true,
      physicalStatus: PhysicalStatus.DITERIMA,
      createdByUserId: relawan.id,
    },
    {
      name: 'Nasi Kuning Box Komplit',
      donorId: donor2.id,
      initialQuantity: 60,
      remainingQuantity: 60,
      unit: 'porsi',
      expiryAt: new Date(now.getTime() + 36 * 3600 * 1000), // in 36 hours
      packagingIntact: true,
      temperatureSafe: true,
      visualSmellOk: true,
      physicalStatus: PhysicalStatus.DITERIMA,
      createdByUserId: relawan.id,
    },
    {
      name: 'Pisang Cavendish Masak Pohon',
      donorId: donor3.id,
      initialQuantity: 25,
      remainingQuantity: 25,
      unit: 'kg',
      expiryAt: new Date(now.getTime() + 60 * 3600 * 1000), // in 2.5 days
      packagingIntact: true,
      temperatureSafe: true,
      visualSmellOk: true,
      physicalStatus: PhysicalStatus.DITERIMA,
      createdByUserId: relawan.id,
    },
    // 🔴 KEDALUWARSA (Expired < 0 hours, waiting for disposal)
    {
      name: 'Kue Basah Tradisional',
      donorId: donor1.id,
      initialQuantity: 20,
      remainingQuantity: 15,
      unit: 'kotak',
      expiryAt: new Date(now.getTime() - 3 * 3600 * 1000), // expired 3 hours ago
      packagingIntact: true,
      temperatureSafe: false,
      visualSmellOk: false,
      physicalStatus: PhysicalStatus.DITERIMA,
      createdByUserId: relawan.id,
    },
  ];

  for (const item of foodSamples) {
    await prisma.foodStock.create({ data: item });
  }

  // 6. Create 1 Recent Distribution for today
  const sampleFood = await prisma.foodStock.findFirst({
    where: { name: 'Nasi Kotak Ayam Bakar Madu' },
  });

  if (sampleFood) {
    await prisma.distribution.create({
      data: {
        beneficiary: { connect: { id: ben1.id } },
        scheduledDate: now,
        status: 'DITERIMA',
        createdByUser: { connect: { id: admin.id } },
        items: {
          create: {
            foodStockId: sampleFood.id,
            quantity: 5,
          },
        },
      },
    });
  }

  console.log('Successfully seeded clean, balanced realistic data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
