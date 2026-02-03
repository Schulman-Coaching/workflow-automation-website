import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  async check() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const database = checks[0].status === 'fulfilled' ? checks[0].value : { status: 'error' };
    const redis = checks[1].status === 'fulfilled' ? checks[1].value : { status: 'error' };

    const isHealthy = database.status === 'ok' && redis.status === 'ok';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database,
        redis,
      },
    };
  }

  @Get('live')
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch {
      return { status: 'not ready' };
    }
  }

  private async checkDatabase(): Promise<{ status: string; latencyMs?: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch {
      return { status: 'error' };
    }
  }

  private async checkRedis(): Promise<{ status: string; latencyMs?: number }> {
    const start = Date.now();
    try {
      await this.redis.set('health:check', 'ok', 'EX', 10);
      const result = await this.redis.get('health:check');
      if (result === 'ok') {
        return { status: 'ok', latencyMs: Date.now() - start };
      }
      return { status: 'error' };
    } catch {
      return { status: 'error' };
    }
  }
}
