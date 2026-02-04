import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/auth.module'; // Adjust based on final auth structure

@Controller('calendar')
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get('booking-pages/:slug')
  async getBookingPage(@Param('slug') slug: string) {
    // Public endpoint to get booking page details
    return { /* ... */ };
  }

  @Get('availability/:bookingPageId')
  async getAvailability(
    @Param('bookingPageId') bookingPageId: string,
    @Query('date') date: string,
  ) {
    return this.calendarService.getAvailability(bookingPageId, new Date(date));
  }

  @Post('bookings')
  async createBooking(@Body() data: any) {
    return this.calendarService.createBooking(data.bookingPageId, data);
  }
}
