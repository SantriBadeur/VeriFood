import { prisma } from '../lib/db';

export interface RecordAuditInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  details: unknown;
}

export const auditService = {
  async record(input: RecordAuditInput) {
    return prisma.auditLog.create({
      data: {
        userId: input.userId || null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        details: typeof input.details === 'string' ? input.details : JSON.stringify(input.details),
      },
    });
  },

  async getLogs(params?: { entity?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where = params?.entity ? { entity: params.entity } : {};

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  },
};

