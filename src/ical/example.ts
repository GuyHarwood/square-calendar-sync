import { getAppleCalendarConfig } from '../config/config'
import { AppleCalendarService, CalendarEvent, CalendarCredentials } from './index'


async function exampleUsage () {
  const credentials: CalendarCredentials = getAppleCalendarConfig()
  const calendarService = new AppleCalendarService(credentials, 'Square Appointments')

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
    console.log('Created event:', eventId)

    const updatedEvent: CalendarEvent = {
      ...newEvent,
      title: 'Square Appointment - Updated',
      description: 'Hair cut and styling appointment',
    }
    await calendarService.updateEvent(eventId, updatedEvent)
    console.log('Updated event:', eventId)

    const retrievedEvent = await calendarService.getEvent(eventId)
    console.log('Retrieved event:', retrievedEvent)

    const allEvents = await calendarService.listEvents(
      new Date('2023-12-01'),
      new Date('2023-12-31')
    )
    console.log('All events in December:', allEvents)

    await calendarService.deleteEvent(eventId)
    console.log('Deleted event:', eventId)
  } catch (error) {
    console.error('Error managing calendar events:', error)
  }
}

export { exampleUsage }
