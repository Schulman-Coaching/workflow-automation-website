import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        plan: true,
        _count: {
          select: {
            users: true,
            emailAccounts: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      settings: org.settings,
      plan: org.plan,
      userCount: org._count.users,
      emailAccountCount: org._count.emailAccounts,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }

  async update(id: string, data: { name?: string; settings?: Record<string, unknown> }) {
    const org = await this.prisma.organization.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
      include: { plan: true },
    });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      settings: org.settings,
      plan: org.plan,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }

  async getMembers(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return users;
  }
}
