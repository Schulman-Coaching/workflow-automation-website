import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { GoogleCalendarProvider } from './providers/google-calendar.provider';
import { OutlookCalendarProvider } from './providers/outlook-calendar.provider';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    GoogleCalendarProvider,
    OutlookCalendarProvider,
  ],
  exports: [CalendarService],
})
export class CalendarModule {}
