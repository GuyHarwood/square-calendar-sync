import { AppleCalendarService } from './calendar-service'
import { CalendarEvent } from './types'
import { getAppleCalendarConfig } from '../config/config'

const appleCredentials = getAppleCalendarConfig()

global.fetch = jest.fn()

const mockPrincipalResponse = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/</D:href>
    <D:propstat>
      <D:prop>
        <D:current-user-principal>
          <D:href>/123456789/principal/</D:href>
        </D:current-user-principal>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`

const mockCalendarHomeResponse = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:response>
    <D:href>/123456789/principal/</D:href>
    <D:propstat>
      <D:prop>
        <C:calendar-home-set>
          <D:href>/123456789/calendars/</D:href>
        </C:calendar-home-set>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`

const mockCalendarListResponse = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:response>
    <D:href>/123456789/calendars/square-appointments/</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>
          <D:collection/>
          <C:calendar/>
        </D:resourcetype>
        <D:displayname>Square Appointments</D:displayname>
        <D:getctag>test-ctag</D:getctag>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`

describe('AppleCalendarService', () => {
  let service: AppleCalendarService

  beforeEach(() => {
    service = new AppleCalendarService(appleCredentials)
    jest.clearAllMocks()
  })

  const setupCalDAVMocks = () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockPrincipalResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockCalendarHomeResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockCalendarListResponse),
      })
  }

  describe('addEvent', () => {
    it('should create a new calendar event', async () => {
      setupCalDAVMocks()

      const mockEvent: CalendarEvent = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date('2023-01-01T10:00:00Z'),
        endDate: new Date('2023-01-01T11:00:00Z'),
        location: 'Test Location',
        squareId: 'square-123',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      })

      const eventId = await service.addEvent(mockEvent)

      expect(eventId).toMatch(/^square-\d+-[a-z0-9]+@squarecalsync\.local$/)
      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringContaining(`/123456789/calendars/square-appointments/${eventId}.ics`),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'text/calendar; charset=utf-8',
            'If-None-Match': '*',
            Authorization: expect.stringContaining('Basic'),
          }),
          body: expect.stringContaining('BEGIN:VCALENDAR'),
        })
      )
    })

    it('should handle all-day events', async () => {
      setupCalDAVMocks()

      const mockEvent: CalendarEvent = {
        title: 'All Day Event',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-02'),
        allDay: true,
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      })

      await service.addEvent(mockEvent)

      const calledBody = (fetch as jest.Mock).mock.calls[3][1].body
      expect(calledBody).toContain('DTSTART;VALUE=DATE:20230101')
      expect(calledBody).toContain('DTEND;VALUE=DATE:20230102')
    })
  })

  describe('updateEvent', () => {
    it('should update an existing calendar event', async () => {
      setupCalDAVMocks()

      const eventId = 'test-event-id'
      const mockEvent: CalendarEvent = {
        title: 'Updated Event',
        startDate: new Date('2023-01-01T10:00:00Z'),
        endDate: new Date('2023-01-01T11:00:00Z'),
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      })

      await service.updateEvent(eventId, mockEvent)

      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringContaining(
          `/123456789/calendars/square-appointments/${eventId}.ics`
        ),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'text/calendar; charset=utf-8',
          }),
        })
      )
    })
  })

  describe('deleteEvent', () => {
    it('should delete a calendar event', async () => {
      setupCalDAVMocks()

      const eventId = 'test-event-id'

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      })

      await service.deleteEvent(eventId)

      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringContaining(
          `/123456789/calendars/square-appointments/${eventId}.ics`
        ),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('getEvent', () => {
    it('should retrieve a calendar event', async () => {
      setupCalDAVMocks()

      const eventId = 'test-event-id'
      const mockICalResponse = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Square Cal Sync//EN
BEGIN:VEVENT
UID:test-event-id
SUMMARY:Test Event
DESCRIPTION:Test Description
LOCATION:Test Location
DTSTART:20230101T100000Z
DTEND:20230101T110000Z
X-SQUARE-ID:square-123
END:VEVENT
END:VCALENDAR`

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockICalResponse),
      })

      const event = await service.getEvent(eventId)

      expect(event).toEqual({
        id: 'test-event-id',
        title: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        startDate: new Date('2023-01-01T10:00:00Z'),
        endDate: new Date('2023-01-01T11:00:00Z'),
        squareId: 'square-123',
        allDay: false,
      })
    })

    it('should return null for non-existent event', async () => {
      setupCalDAVMocks()

      const eventId = 'non-existent-id'

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: jest.fn().mockResolvedValue(''),
      })

      const event = await service.getEvent(eventId)

      expect(event).toBeNull()
    })
  })

  describe('listEvents', () => {
    it('should list calendar events', async () => {
      setupCalDAVMocks()

      const mockCalendarQueryResponse = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:response>
    <D:href>/123456789/calendars/square-appointments/event-1.ics</D:href>
    <D:propstat>
      <D:prop>
        <D:getetag>"test-etag-1"</D:getetag>
        <C:calendar-data>BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Square Cal Sync//EN
BEGIN:VEVENT
UID:event-1
SUMMARY:Event 1
DTSTART:20230101T100000Z
DTEND:20230101T110000Z
END:VEVENT
END:VCALENDAR</C:calendar-data>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  <D:response>
    <D:href>/123456789/calendars/square-appointments/event-2.ics</D:href>
    <D:propstat>
      <D:prop>
        <D:getetag>"test-etag-2"</D:getetag>
        <C:calendar-data>BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Square Cal Sync//EN
BEGIN:VEVENT
UID:event-2
SUMMARY:Event 2
DTSTART:20230102T100000Z
DTEND:20230102T110000Z
END:VEVENT
END:VCALENDAR</C:calendar-data>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockCalendarQueryResponse),
      })

      const events = await service.listEvents()

      expect(events).toHaveLength(2)
      expect(events[0].title).toBe('Event 1')
      expect(events[1].title).toBe('Event 2')
    })

    it('should include date range parameters when provided', async () => {
      setupCalDAVMocks()

      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-01-31')

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:"></D:multistatus>'),
      })

      await service.listEvents(startDate, endDate)

      const lastCall = (fetch as jest.Mock).mock.calls[(fetch as jest.Mock).mock.calls.length - 1]
      expect(lastCall[1].body).toContain('<C:time-range start="20230101T000000Z" end="20230131T000000Z"/>')
    })
  })

  describe('error handling', () => {
    it('should throw error for failed requests', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: jest.fn().mockResolvedValue('Unauthorized access'),
      })

      const mockEvent: CalendarEvent = {
        title: 'Test Event',
        startDate: new Date(),
        endDate: new Date(),
      }

      await expect(service.addEvent(mockEvent)).rejects.toThrow(
        'CalDAV request failed: 401 Unauthorized'
      )
    })
  })

  describe('iCal text escaping', () => {
    it('should properly escape special characters in iCal text', async () => {
      setupCalDAVMocks()

      const mockEvent: CalendarEvent = {
        title: 'Event with; special, characters\\and\nnewlines',
        description: 'Description with\r\nline breaks',
        startDate: new Date('2023-01-01T10:00:00Z'),
        endDate: new Date('2023-01-01T11:00:00Z'),
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      })

      await service.addEvent(mockEvent)

      const calledBody = (fetch as jest.Mock).mock.calls[3][1].body
      expect(calledBody).toContain(
        'SUMMARY:Event with\\; special\\, characters\\\\and\\nnewlines'
      )
      expect(calledBody).toContain(
        'DESCRIPTION:Description with\\r\\nline breaks'
      )
    })
  })
})
