import { CalendarEvent, CalendarCredentials, ICalendarService } from './types'

interface CalendarInfo {
  displayName: string
  url: string
  ctag: string
}

export class AppleCalendarService implements ICalendarService {
  private credentials: CalendarCredentials
  private principalUrl: string | null = null
  private calendarHomeUrl: string | null = null
  private calendars: CalendarInfo[] = []
  private targetCalendar: CalendarInfo | null = null

  constructor(
    credentials: CalendarCredentials,
  ) {
    this.credentials = credentials
  }

  async addEvent(event: CalendarEvent): Promise<string> {
    await this.ensureCalendarDiscovered()
    const eventId = this.generateEventId()
    const icalEvent = this.createICalEvent(event, eventId)

    const eventUrl = `${this.targetCalendar!.url}${eventId}.ics`

    await this.sendCalDAVRequest('PUT', eventUrl, {
      body: icalEvent,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'If-None-Match': '*',
      },
    })

    return eventId
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<void> {
    await this.ensureCalendarDiscovered()
    const icalEvent = this.createICalEvent(event, eventId)
    const eventUrl = `${this.targetCalendar!.url}${eventId}.ics`

    await this.sendCalDAVRequest('PUT', eventUrl, {
      body: icalEvent,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
      },
    })
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.ensureCalendarDiscovered()
    const eventUrl = `${this.targetCalendar!.url}${eventId}.ics`

    await this.sendCalDAVRequest('DELETE', eventUrl)
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    await this.ensureCalendarDiscovered()
    const eventUrl = `${this.targetCalendar!.url}${eventId}.ics`

    try {
      const response = await this.sendCalDAVRequest('GET', eventUrl)
      return this.parseICalEvent(response)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async listEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    await this.ensureCalendarDiscovered()

    const timeRange = this.buildTimeRangeFilter(startDate, endDate)
    const reportBody = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        ${timeRange}
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`

    const response = await this.sendCalDAVRequest('REPORT', this.targetCalendar!.url, {
      body: reportBody,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Depth': '1',
      },
    })

    return this.parseCalendarQueryResponse(response)
  }

  private async ensureCalendarDiscovered(): Promise<void> {
    if (this.targetCalendar) return

    await this.discoverPrincipal()
    await this.discoverCalendarHome()
    await this.discoverCalendars()
    await this.findOrCreateTargetCalendar()
  }

  private async discoverPrincipal(): Promise<void> {
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:current-user-principal/>
  </D:prop>
</D:propfind>`

    const response = await this.sendCalDAVRequest('PROPFIND', '/', {
      body: propfindBody,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Depth': '0',
      },
    })

    // Look for current-user-principal href specifically
    const principalMatch = response.match(/<D:current-user-principal[^>]*>\s*<D:href[^>]*>([^<]+)<\/D:href>/s) ||
                          response.match(/<current-user-principal[^>]*>\s*<href[^>]*>([^<]+)<\/href>/s) ||
                          response.match(/<D:href[^>]*>([^<]+)<\/D:href>/)

    if (!principalMatch) {
      throw new Error(`Failed to discover principal URL. Server response: ${response.substring(0, 500)}`)
    }
    this.principalUrl = principalMatch[1]
  }

  private async discoverCalendarHome(): Promise<void> {
    if (!this.principalUrl) throw new Error('Principal URL not discovered')

    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <C:calendar-home-set/>
  </D:prop>
</D:propfind>`

    const response = await this.sendCalDAVRequest('PROPFIND', this.principalUrl, {
      body: propfindBody,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Depth': '0',
      },
    })

    // Look for calendar-home-set href specifically
    const homeMatch = response.match(/<C:calendar-home-set[^>]*>\s*<D:href[^>]*>([^<]+)<\/D:href>/s) ||
                     response.match(/<calendar-home-set[^>]*>\s*<href[^>]*>([^<]+)<\/href>/s) ||
                     response.match(/<D:href[^>]*>([^<]+)<\/D:href>/)

    if (!homeMatch) {
      throw new Error(`Failed to discover calendar home URL. Server response: ${response.substring(0, 500)}`)
    }
    this.calendarHomeUrl = homeMatch[1]
  }

  private async discoverCalendars(): Promise<void> {
    if (!this.calendarHomeUrl) throw new Error('Calendar home URL not discovered')

    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:resourcetype/>
    <D:displayname/>
    <C:supported-calendar-component-set/>
    <D:getctag/>
  </D:prop>
</D:propfind>`

    const response = await this.sendCalDAVRequest('PROPFIND', this.calendarHomeUrl, {
      body: propfindBody,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Depth': '1',
      },
    })

    this.calendars = this.parseCalendarList(response)
  }

  private async findOrCreateTargetCalendar(): Promise<void> {
    // Filter out system calendars (inbox, outbox, notification)
    const userCalendars = this.calendars.filter(cal =>
      !cal.url.includes('/inbox/') &&
      !cal.url.includes('/outbox/') &&
      !cal.url.includes('/notification/') &&
      cal.displayName !== 'Unnamed Calendar'
    )

    let targetCalendar = userCalendars.find(cal =>
      cal.displayName.trim() === this.credentials.calendarName
    )

    if (!targetCalendar) {
      targetCalendar = userCalendars.find(cal =>
        cal.displayName.toLowerCase().includes(this.credentials.calendarName.toLowerCase())
      )
    }

    if (!targetCalendar) {
      targetCalendar = userCalendars.find(cal =>
        cal.displayName.toLowerCase().includes('calendar')
      )
    }

    if (!targetCalendar) {
      targetCalendar = userCalendars.find(cal =>
        cal.displayName.toLowerCase().includes('home')
      )
    }

    if (!targetCalendar && userCalendars.length > 0) {
      targetCalendar = userCalendars[0]
    }

    if (!targetCalendar) {
      throw new Error(`No suitable calendar found. Available calendars: ${userCalendars.map(c => c.displayName).join(', ')}`)
    }

    this.targetCalendar = targetCalendar
  }

  private async sendCalDAVRequest(
    method: string,
    url: string,
    options: any = {}
  ): Promise<string> {
    const fullUrl = url.startsWith('http') ? url : `${this.credentials.caldavServerUrl}${url}`

    const response = await fetch(fullUrl, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.credentials.appleId}:${this.credentials.appPassword}`).toString('base64')}`,
        'User-Agent': 'Square-Cal-Sync/1.0',
        ...options.headers,
      },
      body: options.body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `CalDAV request failed: ${response.status} ${response.statusText}\n${errorText}`
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

  private parseCalendarList(xmlResponse: string): CalendarInfo[] {
    const calendars: CalendarInfo[] = []

    // Remove namespace prefixes for easier parsing
    const cleanXml = xmlResponse.replace(/xmlns:[^=]*="[^"]*"/g, '').replace(/[A-Z]:/g, '')

    const responseRegex = /<response[^>]*>(.*?)<\/response>/gs
    let match

    while ((match = responseRegex.exec(cleanXml)) !== null) {
      const responseContent = match[1]

      // Check if this is a calendar resource (contains calendar in resourcetype)
      const isCalendar = responseContent.includes('<calendar/>') ||
                        responseContent.includes('<calendar />') ||
                        responseContent.includes('supported-calendar-component-set')

      if (isCalendar) {
        const hrefMatch = responseContent.match(/<href[^>]*>([^<]+)<\/href>/)
        const displayNameMatch = responseContent.match(/<displayname[^>]*>([^<]*)<\/displayname>/)
        const ctagMatch = responseContent.match(/<getctag[^>]*>([^<]*)<\/getctag>/)

        if (hrefMatch) {
          const calendar = {
            url: hrefMatch[1],
            displayName: displayNameMatch ? displayNameMatch[1] : 'Unnamed Calendar',
            ctag: ctagMatch ? ctagMatch[1] : ''
          }
          calendars.push(calendar)
        }
      }
    }

    return calendars
  }

  private buildTimeRangeFilter(startDate?: Date, endDate?: Date): string {
    if (!startDate && !endDate) return ''

    const start = startDate ? startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : ''
    const end = endDate ? endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : ''

    return `<C:time-range start="${start}" end="${end}"/>`
  }

  private parseCalendarQueryResponse(xmlResponse: string): CalendarEvent[] {
    const events: CalendarEvent[] = []
    const responseRegex = /<D:response[^>]*>(.*?)<\/D:response>/gs
    let match

    while ((match = responseRegex.exec(xmlResponse)) !== null) {
      const responseContent = match[1]
      const calendarDataMatch = responseContent.match(/<C:calendar-data[^>]*>(.*?)<\/C:calendar-data>/s)

      if (calendarDataMatch) {
        const icalData = calendarDataMatch[1].trim()
        if (icalData.includes('BEGIN:VEVENT')) {
          try {
            const event = this.parseICalEvent(icalData)
            events.push(event)
          } catch (error) {
            console.warn('Failed to parse iCal event:', error)
          }
        }
      }
    }

    return events
  }

  private generateEventId(): string {
    return `square-${Date.now()}-${Math.random().toString(36).substring(2, 11)}@squarecalsync.local`
  }
}
