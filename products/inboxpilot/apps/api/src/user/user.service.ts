import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });
  }

  async updateSettings(userId: string, settings: Record<string, unknown>) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { settings: settings as any },
      include: { organization: true },
    });

    return this.sanitizeUser(user);
  }

  async updateProfile(
    userId: string,
    data: { name?: string; avatarUrl?: string },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: { organization: true },
    });

    return this.sanitizeUser(user);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sanitizeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      settings: user.settings,
      organizationId: user.organizationId,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
