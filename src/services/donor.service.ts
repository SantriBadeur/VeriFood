import { prisma } from '../lib/db';
import { DonorType } from '@prisma/client';
import { auditService } from './audit.service';

export interface CreateDonorInput {
  name: string;
  type: DonorType;
  contact: string;
  address?: string;
}

export const donorService = {
  async list(params?: { search?: string; type?: DonorType; page?: number; limit?: number }) {
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
      prisma.donor.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.donor.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async create(input: CreateDonorInput, actorUserId?: string) {
    if (!input.name || !input.contact || !input.type) {
      throw new Error('Nama, kontak, dan jenis donatur wajib diisi');
    }

    const donor = await prisma.donor.create({
      data: {
        name: input.name,
        type: input.type,
        contact: input.contact,
        address: input.address || null,
      },
    });

    await auditService.record({
      userId: actorUserId,
      action: 'DONOR_CREATE',
      entity: 'Donor',
      entityId: donor.id,
      details: input,
    });

    return donor;
  },

  async update(id: string, input: Partial<CreateDonorInput>, actorUserId?: string) {
    const donor = await prisma.donor.update({
      where: { id },
      data: input,
    });

    await auditService.record({
      userId: actorUserId,
      action: 'DONOR_UPDATE',
      entity: 'Donor',
      entityId: donor.id,
      details: input,
    });

    return donor;
  },

  async softDelete(id: string, actorUserId?: string) {
    const donor = await prisma.donor.update({
      where: { id },
      data: { isDeleted: true },
    });

    await auditService.record({
      userId: actorUserId,
      action: 'DONOR_DELETE',
      entity: 'Donor',
      entityId: donor.id,
      details: { isDeleted: true },
    });

    return donor;
  },
};

