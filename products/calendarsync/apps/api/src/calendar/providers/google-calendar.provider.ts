import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleCalendarProvider {
  private oauth2Client;

  constructor(private configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GMAIL_CLIENT_ID'),
      this.configService.get('GMAIL_CLIENT_SECRET'),
      this.configService.get('GMAIL_REDIRECT_URI'),
    );
  }

  async getBusySlots(accessToken: string, start: Date, end: Date) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        items: [{ id: 'primary' }],
      },
    });

    return response.data.calendars?.primary?.busy || [];
  }
}
