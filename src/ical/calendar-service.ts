import { CalendarEvent, CalendarCredentials, ICalendarService } from './types'

export class AppleCalendarService implements ICalendarService {
  private credentials: CalendarCredentials
  private calendarName: string

  constructor(
    credentials: CalendarCredentials,
    calendarName: string = 'Square Appointments'
  ) {
    this.credentials = credentials
    this.calendarName = calendarName
  }

  async addEvent(event: CalendarEvent): Promise<string> {
    const eventId = this.generateEventId()
    const icalEvent = this.createICalEvent(event, eventId)

    await this.sendCalendarRequest(
      'POST',
      `/calendars/${this.calendarName}/events`,
      {
        body: icalEvent,
        headers: {
          'Content-Type': 'text/calendar',
        },
      }
    )

    return eventId
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<void> {
    const icalEvent = this.createICalEvent(event, eventId)

    await this.sendCalendarRequest(
      'PUT',
      `/calendars/${this.calendarName}/events/${eventId}`,
      {
        body: icalEvent,
        headers: {
          'Content-Type': 'text/calendar',
        },
      }
    )
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.sendCalendarRequest(
      'DELETE',
      `/calendars/${this.calendarName}/events/${eventId}`
    )
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      const response = await this.sendCalendarRequest(
        'GET',
        `/calendars/${this.calendarName}/events/${eventId}`
      )
      return this.parseICalEvent(response)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async listEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    const params = new URLSearchParams()
    if (startDate) {
      params.append('start', startDate.toISOString())
    }
    if (endDate) {
      params.append('end', endDate.toISOString())
    }

    const response = await this.sendCalendarRequest(
      'GET',
      `/calendars/${this.calendarName}/events?${params.toString()}`
    )
    return this.parseICalEvents(response)
  }

  private async sendCalendarRequest(
    method: string,
    path: string,
    options: any = {}
  ): Promise<string> {
    const baseUrl = this.credentials.caldavServerUrl
    const url = `${baseUrl}${path}`

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.credentials.appleId}:${this.credentials.appPassword}`).toString('base64')}`,
        'User-Agent': 'Square-Cal-Sync/1.0',
        ...options.headers,
      },
      body: options.body,
    })

    if (!response.ok) {
      throw new Error(
        `Calendar request failed: ${response.status} ${response.statusText}`
      )
    }

    return await response.text()
  }

  private createICalEvent(event: CalendarEvent, eventId: string): string {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    const startTime = event.allDay
      ? event.startDate.toISOString().split('T')[0].replace(/-/g, '')
      : event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    const endTime = event.allDay
      ? event.endDate.toISOString().split('T')[0].replace(/-/g, '')
      : event.endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    let icalData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Square Cal Sync//EN',
      'BEGIN:VEVENT',
      `UID:${eventId}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART${event.allDay ? ';VALUE=DATE' : ''}:${startTime}`,
      `DTEND${event.allDay ? ';VALUE=DATE' : ''}:${endTime}`,
      `SUMMARY:${this.escapeICalText(event.title)}`,
    ]

    if (event.description) {
      icalData.push(`DESCRIPTION:${this.escapeICalText(event.description)}`)
    }

    if (event.location) {
      icalData.push(`LOCATION:${this.escapeICalText(event.location)}`)
    }

    if (event.squareId) {
      icalData.push(`X-SQUARE-ID:${event.squareId}`)
    }

    icalData.push('END:VEVENT')
    icalData.push('END:VCALENDAR')

    return icalData.join('\r\n')
  }

  private parseICalEvent(icalData: string): CalendarEvent {
    const lines = icalData.split('\n')
    const event: Partial<CalendarEvent> = { allDay: false }

    for (const line of lines) {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()

      switch (true) {
        case key === 'UID':
          event.id = value
          break
        case key === 'SUMMARY':
          event.title = this.unescapeICalText(value)
          break
        case key === 'DESCRIPTION':
          event.description = this.unescapeICalText(value)
          break
        case key === 'LOCATION':
          event.location = this.unescapeICalText(value)
          break
        case key.startsWith('DTSTART'):
          event.startDate = this.parseICalDate(value)
          event.allDay = key.includes('VALUE=DATE')
          break
        case key.startsWith('DTEND'):
          event.endDate = this.parseICalDate(value)
          break
        case key === 'X-SQUARE-ID':
          event.squareId = value
          break
      }
    }

    return event as CalendarEvent
  }

  private parseICalEvents(icalData: string): CalendarEvent[] {
    const events: CalendarEvent[] = []
    const eventBlocks = icalData.split('BEGIN:VEVENT').slice(1)

    for (const block of eventBlocks) {
      const eventData =
        'BEGIN:VEVENT' + block.split('END:VEVENT')[0] + 'END:VEVENT'
      events.push(this.parseICalEvent(eventData))
    }

    return events
  }

  private parseICalDate(dateString: string): Date {
    if (dateString.length === 8) {
      const year = parseInt(dateString.substring(0, 4))
      const month = parseInt(dateString.substring(4, 6)) - 1
      const day = parseInt(dateString.substring(6, 8))
      return new Date(year, month, day)
    } else {
      return new Date(
        dateString.replace(
          /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
          '$1-$2-$3T$4:$5:$6Z'
        )
      )
    }
  }

  private escapeICalText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
  }

  private unescapeICalText(text: string): string {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\')
  }

  private generateEventId(): string {
    return `square-${Date.now()}-${Math.random().toString(36).substring(2, 11)}@squarecalsync.local`
  }
}
