import { prisma } from '../lib/db';
import { BeneficiaryType, Role } from '@prisma/client';
import { auditService } from './audit.service';

export interface CreateBeneficiaryInput {
  name: string;
  type: BeneficiaryType;
  contact: string;
  address: string;
}

export const beneficiaryService = {
  async list(params?: { search?: string; type?: BeneficiaryType; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isDeleted: false,
    };

    if (params?.type) {
      where.type = params.type;
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search } },
        { contact: { contains: params.search } },
        { address: { contains: params.search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.beneficiary.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.beneficiary.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async create(input: CreateBeneficiaryInput, userRole: Role | string, actorUserId?: string) {
    if (userRole !== 'ADMIN') {
      throw new Error('Hanya Admin yang dapat mengelola data penerima');
    }

    if (!input.name || !input.contact || !input.type || !input.address) {
      throw new Error('Nama, kontak, alamat, dan jenis penerima wajib diisi');
    }

    const beneficiary = await prisma.beneficiary.create({
      data: {
        name: input.name,
        type: input.type,
        contact: input.contact,
        address: input.address,
      },
    });

    await auditService.record({
      userId: actorUserId,
      action: 'BENEFICIARY_CREATE',
      entity: 'Beneficiary',
      entityId: beneficiary.id,
      details: input,
    });

    return beneficiary;
  },

  async update(id: string, input: Partial<CreateBeneficiaryInput>, userRole: Role | string, actorUserId?: string) {
    if (userRole !== 'ADMIN') {
      throw new Error('Hanya Admin yang dapat mengelola data penerima');
    }

    const beneficiary = await prisma.beneficiary.update({
      where: { id },
      data: input,
    });

    await auditService.record({
      userId: actorUserId,
      action: 'BENEFICIARY_UPDATE',
      entity: 'Beneficiary',
      entityId: beneficiary.id,
      details: input,
    });

    return beneficiary;
  },

  async softDelete(id: string, userRole: Role | string, actorUserId?: string) {
    if (userRole !== 'ADMIN') {
      throw new Error('Hanya Admin yang dapat mengelola data penerima');
    }

    const beneficiary = await prisma.beneficiary.update({
      where: { id },
      data: { isDeleted: true },
    });

    await auditService.record({
      userId: actorUserId,
      action: 'BENEFICIARY_DELETE',
      entity: 'Beneficiary',
      entityId: beneficiary.id,
      details: { isDeleted: true },
    });

    return beneficiary;
  },
};

