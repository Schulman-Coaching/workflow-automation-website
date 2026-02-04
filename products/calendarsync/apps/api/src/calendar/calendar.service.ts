import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { GoogleCalendarProvider } from './providers/google-calendar.provider';
import { OutlookCalendarProvider } from './providers/outlook-calendar.provider';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
    private googleProvider: GoogleCalendarProvider,
    private outlookProvider: OutlookCalendarProvider,
  ) {}

  async getAvailability(bookingPageId: string, date: Date) {
    const bookingPage = await this.prisma.bookingPage.findUnique({
      where: { id: bookingPageId },
      include: { organization: true },
    });

    if (!bookingPage) throw new Error('Booking page not found');

    // Get connected calendar accounts for this organization
    const accounts = await this.prisma.calendarAccount.findMany({
      where: { organizationId: bookingPage.organizationId, isActive: true },
    });

    // In a real app, you'd fetch busy slots from each provider
    // and intersect them with the booking page availability.
    return {
      availableSlots: [
        { start: '09:00', end: '09:30' },
        { start: '10:00', end: '10:30' },
      ],
    };
  }

  async createBooking(bookingPageId: string, data: { name: string, email: string, startTime: Date }) {
    const bookingPage = await this.prisma.bookingPage.findUnique({
      where: { id: bookingPageId },
    });

    if (!bookingPage) throw new Error('Booking page not found');

    const endTime = new Date(data.startTime.getTime() + bookingPage.durationMinutes * 60000);

    const appointment = await this.prisma.appointment.create({
      data: {
        organizationId: bookingPage.organizationId,
        calendarAccountId: 'some-active-account-id', // Simplified
        bookingPageId: bookingPage.id,
        customerName: data.name,
        customerEmail: data.email,
        startTime: data.startTime,
        endTime: endTime,
        status: 'scheduled',
      },
    });

    // Sync to external calendar here
    return appointment;
  }
}
