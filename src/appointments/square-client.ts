import { Client, Environment } from 'square'
import {
  SquareConfig,
  SquareAppointment,
  SquareAppointmentsFilter,
  SquareAppointmentsResponse,
} from './types'

export class SquareAppointmentsClient {
  private client: Client
  private locationId: string

  constructor(config: SquareConfig) {
    this.client = new Client({
      accessToken: config.accessToken,
      environment:
        config.environment === 'production'
          ? Environment.Production
          : Environment.Sandbox,
    })
    this.locationId = config.locationId
  }

  async getAppointments(
    filter: Partial<SquareAppointmentsFilter> = {}
  ): Promise<SquareAppointmentsResponse> {
    try {
      const bookingsApi = this.client.bookingsApi

      const response = await bookingsApi.listBookings(
        filter.limit,
        filter.cursor,
        undefined, // customerId
        filter.teamMemberId,
        filter.locationId || this.locationId,
        filter.startAtMin,
        filter.startAtMax
      )

      if (response.result.errors && response.result.errors.length > 0) {
        throw new Error(
          `Square API error: ${response.result.errors
            .map((e: any) => e.detail)
            .join(', ')}`
        )
      }

      return {
        appointments: (response.result.bookings || []).map(
          this.mapToSquareAppointment
        ),
        cursor: response.result.cursor,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch appointments: ${error.message}`)
      }
      throw new Error('Failed to fetch appointments: Unknown error')
    }
  }

  async getAppointmentById(appointmentId: string): Promise<SquareAppointment> {
    try {
      const bookingsApi = this.client.bookingsApi
      const response = await bookingsApi.retrieveBooking(appointmentId)

      if (response.result.errors && response.result.errors.length > 0) {
        throw new Error(
          `Square API error: ${response.result.errors
            .map((e: any) => e.detail)
            .join(', ')}`
        )
      }

      if (!response.result.booking) {
        throw new Error(`Appointment with ID ${appointmentId} not found`)
      }

      return this.mapToSquareAppointment(response.result.booking)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch appointment: ${error.message}`)
      }
      throw new Error('Failed to fetch appointment: Unknown error')
    }
  }

  async getFutureAppointments(
    daysAhead: number = 30
  ): Promise<SquareAppointmentsResponse> {
    const now = new Date()
    const future = new Date()
    future.setDate(now.getDate() + daysAhead)

    return this.getAppointments({
      startAtMin: now.toISOString(),
      startAtMax: future.toISOString(),
    })
  }

  private mapToSquareAppointment(booking: any): SquareAppointment {
    return {
      id: booking.id,
      locationId: booking.locationId,
      status: booking.bookingStatus,
      startAt: booking.startAt,
      appointmentSegments: booking.appointmentSegments || [],
      version: booking.version,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      source: booking.bookingSource,
    }
  }
}
