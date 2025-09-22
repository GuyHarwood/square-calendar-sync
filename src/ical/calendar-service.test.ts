import { AppleCalendarService } from './calendar-service'
import { CalendarEvent, CalendarCredentials } from './types'

const mockCredentials: CalendarCredentials = {
  appleId: 'test@example.com',
  appPassword: 'test-password',
  caldavServerUrl: 'url'
}

global.fetch = jest.fn()

describe('AppleCalendarService', () => {
  let service: AppleCalendarService

  beforeEach(() => {
    service = new AppleCalendarService(mockCredentials)
    jest.clearAllMocks()
  })

  describe('addEvent', () => {
    it('should create a new calendar event', async () => {
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
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/calendars/Square Appointments/events'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'text/calendar',
            Authorization: expect.stringContaining('Basic'),
          }),
          body: expect.stringContaining('BEGIN:VCALENDAR'),
        })
      )
    })

    it('should handle all-day events', async () => {
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

      const calledBody = (fetch as jest.Mock).mock.calls[0][1].body
      expect(calledBody).toContain('DTSTART;VALUE=DATE:20230101')
      expect(calledBody).toContain('DTEND;VALUE=DATE:20230102')
    })
  })

  describe('updateEvent', () => {
    it('should update an existing calendar event', async () => {
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

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/calendars/Square Appointments/events/${eventId}`
        ),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'text/calendar',
          }),
        })
      )
    })
  })

  describe('deleteEvent', () => {
    it('should delete a calendar event', async () => {
      const eventId = 'test-event-id'

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      })

      await service.deleteEvent(eventId)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/calendars/Square Appointments/events/${eventId}`
        ),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('getEvent', () => {
    it('should retrieve a calendar event', async () => {
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
      const eventId = 'non-existent-id'

      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('404 Not Found'))

      const event = await service.getEvent(eventId)

      expect(event).toBeNull()
    })
  })

  describe('listEvents', () => {
    it('should list calendar events', async () => {
      const mockICalResponse = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Square Cal Sync//EN
BEGIN:VEVENT
UID:event-1
SUMMARY:Event 1
DTSTART:20230101T100000Z
DTEND:20230101T110000Z
END:VEVENT
BEGIN:VEVENT
UID:event-2
SUMMARY:Event 2
DTSTART:20230102T100000Z
DTEND:20230102T110000Z
END:VEVENT
END:VCALENDAR`

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockICalResponse),
      })

      const events = await service.listEvents()

      expect(events).toHaveLength(2)
      expect(events[0].title).toBe('Event 1')
      expect(events[1].title).toBe('Event 2')
    })

    it('should include date range parameters when provided', async () => {
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-01-31')

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('BEGIN:VCALENDAR\nEND:VCALENDAR'),
      })

      await service.listEvents(startDate, endDate)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'start=2023-01-01T00%3A00%3A00.000Z&end=2023-01-31T00%3A00%3A00.000Z'
        ),
        expect.any(Object)
      )
    })
  })

  describe('error handling', () => {
    it('should throw error for failed requests', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      const mockEvent: CalendarEvent = {
        title: 'Test Event',
        startDate: new Date(),
        endDate: new Date(),
      }

      await expect(service.addEvent(mockEvent)).rejects.toThrow(
        'Calendar request failed: 401 Unauthorized'
      )
    })
  })

  describe('iCal text escaping', () => {
    it('should properly escape special characters in iCal text', async () => {
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

      const calledBody = (fetch as jest.Mock).mock.calls[0][1].body
      expect(calledBody).toContain(
        'SUMMARY:Event with\\; special\\, characters\\\\and\\nnewlines'
      )
      expect(calledBody).toContain(
        'DESCRIPTION:Description with\\r\\nline breaks'
      )
    })
  })
})
