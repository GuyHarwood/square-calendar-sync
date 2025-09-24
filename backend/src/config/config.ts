import * as dotenv from 'dotenv'
import { SquareConfig } from '../appointments/types'
import { CalendarCredentials } from '../ical'

dotenv.config()

export function getSquareConfig (): SquareConfig {
  const daysAhead = 30
  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const applicationId = process.env.SQUARE_APPLICATION_ID
  const locationId = process.env.SQUARE_LOCATION_ID
  const environment = process.env.SQUARE_ENVIRONMENT as 'production' | 'sandbox'

  if (!accessToken || !applicationId || !locationId || !environment) {
    throw new Error(
      'Missing required Square configuration. Please check your environment variables.'
    )
  }

  if (environment !== 'production' && environment !== 'sandbox') {
    throw new Error(
      'SQUARE_ENVIRONMENT must be either "production" or "sandbox"'
    )
  }

  return {
    daysAhead,
    accessToken,
    applicationId,
    locationId,
    environment,
  }
}

export function getAppleCalendarConfig (): CalendarCredentials {
  const appleUsername = process.env.APPLE_USERNAME
  const appPassword = process.env.APPLE_APP_PASSWORD
  const caldavServerUrl = process.env.APPLE_CALDAV_SERVER
  const calendarName = process.env.APPLE_CALENDAR_NAME

  if (!appleUsername || !appPassword || !caldavServerUrl || !calendarName) {
    throw new Error('Missing required Apple Calendar configuration.  Please check your environment variables.')
  }

  return {
    appleId: appleUsername,
    appPassword: appPassword,
    caldavServerUrl: caldavServerUrl,
    calendarName: calendarName
  }
}
