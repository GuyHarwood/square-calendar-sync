import { SquareAppointmentsClient } from './square-client';
import {
  SquareConfig,
  SquareAppointment,
  SquareAppointmentsFilter,
  SquareAppointmentsResponse,
} from './types';

export class AppointmentsService {
  private squareClient: SquareAppointmentsClient;

  constructor(config: SquareConfig) {
    this.squareClient = new SquareAppointmentsClient(config);
  }

  async getAllFutureAppointments(
    daysAhead: number = 30
  ): Promise<SquareAppointment[]> {
    try {
      const appointments: SquareAppointment[] = [];
      let cursor: string | undefined;

      do {
        const response = await this.squareClient.getFutureAppointments(
          daysAhead
        );
        appointments.push(...response.appointments);
        cursor = response.cursor;
      } while (cursor);

      return appointments.filter(
        (appointment) =>
          appointment.status === 'ACCEPTED' || appointment.status === 'PENDING'
      );
    } catch (error) {
      throw new Error(
        `Failed to retrieve future appointments: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<SquareAppointment[]> {
    try {
      const filter: Partial<SquareAppointmentsFilter> = {
        startAtMin: startDate.toISOString(),
        startAtMax: endDate.toISOString(),
      };

      const appointments: SquareAppointment[] = [];
      let cursor: string | undefined;

      do {
        const response = await this.squareClient.getAppointments({
          ...filter,
          cursor,
        });
        appointments.push(...response.appointments);
        cursor = response.cursor;
      } while (cursor);

      return appointments;
    } catch (error) {
      throw new Error(
        `Failed to retrieve appointments for date range: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async getAppointmentById(appointmentId: string): Promise<SquareAppointment> {
    try {
      return await this.squareClient.getAppointmentById(appointmentId);
    } catch (error) {
      throw new Error(
        `Failed to retrieve appointment ${appointmentId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async getAppointmentsByTeamMember(
    teamMemberId: string,
    daysAhead: number = 30
  ): Promise<SquareAppointment[]> {
    try {
      const now = new Date();
      const future = new Date();
      future.setDate(now.getDate() + daysAhead);

      const filter: Partial<SquareAppointmentsFilter> = {
        teamMemberId,
        startAtMin: now.toISOString(),
        startAtMax: future.toISOString(),
      };

      const appointments: SquareAppointment[] = [];
      let cursor: string | undefined;

      do {
        const response = await this.squareClient.getAppointments({
          ...filter,
          cursor,
        });
        appointments.push(...response.appointments);
        cursor = response.cursor;
      } while (cursor);

      return appointments;
    } catch (error) {
      throw new Error(
        `Failed to retrieve appointments for team member ${teamMemberId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  isAppointmentActive(appointment: SquareAppointment): boolean {
    return appointment.status === 'ACCEPTED' || appointment.status === 'PENDING';
  }

  getAppointmentDuration(appointment: SquareAppointment): number {
    return appointment.appointmentSegments.reduce(
      (total, segment) =>
        total + segment.durationMinutes + (segment.intermissionMinutes || 0),
      0
    );
  }

  getAppointmentEndTime(appointment: SquareAppointment): Date {
    const startTime = new Date(appointment.startAt);
    const duration = this.getAppointmentDuration(appointment);
    return new Date(startTime.getTime() + duration * 60 * 1000);
  }
}