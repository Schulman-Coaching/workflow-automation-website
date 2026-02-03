import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { GmailProvider } from './providers/gmail.provider';
import { OutlookProvider } from './providers/outlook.provider';

@Module({
  controllers: [EmailController],
  providers: [EmailService, GmailProvider, OutlookProvider],
  exports: [EmailService, GmailProvider, OutlookProvider],
})
export class EmailModule {}
