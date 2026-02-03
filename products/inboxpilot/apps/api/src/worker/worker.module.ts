import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkerService } from './worker.service';
import { EmailSyncProcessor } from './processors/email-sync.processor';
import { EmailTriageProcessor } from './processors/email-triage.processor';
import { FollowUpProcessor } from './processors/follow-up.processor';
import { EmailModule } from '@/email/email.module';
import { AIModule } from '@/ai/ai.module';

export const QUEUE_NAMES = {
  EMAIL_SYNC: 'email-sync',
  EMAIL_TRIAGE: 'email-triage',
  FOLLOW_UP: 'follow-up',
} as const;

@Module({
  imports: [forwardRef(() => EmailModule), forwardRef(() => AIModule)],
  providers: [
    WorkerService,
    EmailSyncProcessor,
    EmailTriageProcessor,
    FollowUpProcessor,
    {
      provide: 'REDIS_CONNECTION',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url', 'redis://localhost:6379');
        try {
          const url = new URL(redisUrl);
          return {
            host: url.hostname || 'localhost',
            port: parseInt(url.port || '6379', 10),
          };
        } catch {
          return { host: 'localhost', port: 6379 };
        }
      },
    },
  ],
  exports: [WorkerService],
})
export class WorkerModule {}
