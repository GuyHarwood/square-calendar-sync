export interface SquareAppointment {
  id: string;
  locationId: string;
  status?: 'ACCEPTED' | 'PENDING' | 'CANCELLED' | 'DECLINED' | 'NO_SHOW';
  startAt: string;
  appointmentSegments: AppointmentSegment[];
  version: number;
  createdAt: string;
  updatedAt: string;
  source: 'FIRST_PARTY_MERCHANT' | 'FIRST_PARTY_BUYER' | 'THIRD_PARTY_BUYER';
}

export interface AppointmentSegment {
  durationMinutes: number;
  serviceVariation: {
    itemVariationId: string;
    version: number;
  };
  teamMemberId: string;
  resourceIds?: string[];
  intermissionMinutes?: number;
  anyTeamMember?: boolean;
  serviceVariationVersion?: number;
}

export interface SquareAppointmentsFilter {
  locationId: string;
  startAtMin?: string;
  startAtMax?: string;
  bookingId?: string;
  teamMemberId?: string;
  limit?: number;
  cursor?: string;
}

export interface SquareAppointmentsResponse {
  appointments: SquareAppointment[];
  cursor?: string;
}

export interface SquareConfig {
  daysAhead: number;
  accessToken: string;
  applicationId: string;
  locationId: string;
  environment: 'production' | 'sandbox';
}
