import { Module } from '@nestjs/common';
import { FollowUpService } from './follow-up.service';
import { FollowUpController } from './follow-up.controller';

@Module({
  providers: [FollowUpService],
  controllers: [FollowUpController],
  exports: [FollowUpService],
})
export class FollowUpModule {}
