import { getAppleCalendarConfig } from '../config/config'
import { AppleCalendarService, CalendarEvent, CalendarCredentials } from './index'

describe('AppleCalendarService Integration', () => {
  let credentials: CalendarCredentials
  let calendarService: AppleCalendarService

  beforeAll(() => {
      credentials = getAppleCalendarConfig()
      calendarService = new AppleCalendarService(credentials)
  })

  it('should perform full calendar integration workflow', async () => {

    const newEvent: CalendarEvent = {
      title: 'Square Appointment',
      description: 'Hair cut appointment',
      startDate: new Date('2023-12-02T10:00:00Z'),
      endDate: new Date('2023-12-02T11:00:00Z'),
      location: 'Square Salon',
      squareId: 'square-appointment-123',
    }

    try {
      const eventId = await calendarService.addEvent(newEvent)
      expect(eventId).toBeDefined()

      const updatedEvent: CalendarEvent = {
        ...newEvent,
        title: 'Square Appointment - Updated',
        description: 'Hair cut and styling appointment',
      }
      await calendarService.updateEvent(eventId, updatedEvent)

      const retrievedEvent = await calendarService.getEvent(eventId)
      expect(retrievedEvent?.title).toBe('Square Appointment - Updated')

      const allEvents = await calendarService.listEvents(
        new Date('2023-12-01'),
        new Date('2023-12-31')
      )
      expect(Array.isArray(allEvents)).toBe(true)

      await calendarService.deleteEvent(eventId)

      const deletedEvent = await calendarService.getEvent(eventId)
      expect(deletedEvent).toBeNull()
    } catch (error) {
      console.error('Integration test failed:', error)
      throw error
    }
  }, 30000)
})
