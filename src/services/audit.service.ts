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

  async getLogs(params?: {
    entity?: string;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params?.entity) {
      where.entity = params.entity;
    }
    if (params?.startDate || params?.endDate) {
      const createdAtFilter: Record<string, Date> = {};
      if (params.startDate) createdAtFilter.gte = new Date(params.startDate);
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        createdAtFilter.lte = end;
      }
      where.createdAt = createdAtFilter;
    }

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

