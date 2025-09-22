export interface CalendarEvent {
  id?: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  location?: string
  allDay?: boolean
  squareId?: string
}

export interface CalendarCredentials {
  appleId: string
  appPassword: string
  caldavServerUrl: string
  calendarName: string
}

export interface ICalendarService {
  addEvent(event: CalendarEvent): Promise<string>
  updateEvent(eventId: string, event: CalendarEvent): Promise<void>
  deleteEvent(eventId: string): Promise<void>
  getEvent(eventId: string): Promise<CalendarEvent | null>
  listEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>
}
