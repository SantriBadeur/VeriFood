import { PrismaClient, Role, DonorType, BeneficiaryType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Users
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
      name: 'Relawan Lapangan 1',
      passwordHash: relawanPasswordHash,
      role: Role.RELAWAN,
      isActive: true,
    },
  });

  console.log(`Users seeded: Admin (${admin.email}), Relawan (${relawan.email})`);

  // 2. Seed Sample Donors
  const donor1 = await prisma.donor.upsert({
    where: { id: 'donor-1' },
    update: {},
    create: {
      id: 'donor-1',
      name: 'Restoran Padang Sederhana',
      type: DonorType.RESTORAN,
      contact: '081234567890',
      address: 'Jl. Sudirman No. 10',
    },
  });

  const donor2 = await prisma.donor.upsert({
    where: { id: 'donor-2' },
    update: {},
    create: {
      id: 'donor-2',
      name: 'Katering Berkah Rasa',
      type: DonorType.KATERING,
      contact: '082345678901',
      address: 'Jl. Gatot Subroto No. 45',
    },
  });

  const donor3 = await prisma.donor.upsert({
    where: { id: 'donor-3' },
    update: {},
    create: {
      id: 'donor-3',
      name: 'Supermarket Segar Jaya',
      type: DonorType.SUPERMARKET,
      contact: '083456789012',
      address: 'Jl. Thamrin No. 8',
    },
  });

  console.log('Donors seeded.');

  // 3. Seed Sample Beneficiaries
  const ben1 = await prisma.beneficiary.upsert({
    where: { id: 'ben-1' },
    update: {},
    create: {
      id: 'ben-1',
      name: 'Panti Asuhan Kasih Ibu',
      type: BeneficiaryType.PANTI_ASUHAN,
      contact: '085678901234',
      address: 'Jl. Anggrek No. 12',
    },
  });

  const ben2 = await prisma.beneficiary.upsert({
    where: { id: 'ben-2' },
    update: {},
    create: {
      id: 'ben-2',
      name: 'Komunitas Dhuafa Sejahtera',
      type: BeneficiaryType.KOMUNITAS,
      contact: '086789012345',
      address: 'Jl. Melati No. 5',
    },
  });

  console.log('Beneficiaries seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
