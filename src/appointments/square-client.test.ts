import { SquareAppointmentsClient } from './square-client';
import { SquareConfig } from './types';
import { Client } from 'square';

jest.mock('square');

const mockConfig: SquareConfig = {
  accessToken: 'test-token',
  applicationId: 'test-app-id',
  locationId: 'test-location-id',
  environment: 'sandbox',
};

const mockAppointment = {
  id: 'appointment-1',
  locationId: 'test-location-id',
  bookingStatus: 'ACCEPTED',
  startAt: '2024-01-15T10:00:00Z',
  appointmentSegments: [
    {
      durationMinutes: 60,
      serviceVariation: {
        itemVariationId: 'service-1',
        version: 1,
      },
      teamMemberId: 'team-member-1',
    },
  ],
  version: 1,
  createdAt: '2024-01-10T08:00:00Z',
  updatedAt: '2024-01-10T08:00:00Z',
  bookingSource: 'FIRST_PARTY_MERCHANT',
};

describe('SquareAppointmentsClient', () => {
  let client: SquareAppointmentsClient;
  let mockBookingsApi: any;

  beforeEach(() => {
    mockBookingsApi = {
      listBookings: jest.fn(),
      retrieveBooking: jest.fn(),
    };

    (Client as jest.MockedClass<typeof Client>).mockImplementation(() => ({
      bookingsApi: mockBookingsApi,
    }) as any);

    client = new SquareAppointmentsClient(mockConfig);
  });

  describe('getAppointments', () => {
    it('should fetch appointments successfully', async () => {
      const mockResponse = {
        result: {
          bookings: [mockAppointment],
          cursor: 'next-page-cursor',
        },
      };

      mockBookingsApi.listBookings.mockResolvedValue(mockResponse);

      const result = await client.getAppointments();

      expect(result.appointments).toHaveLength(1);
      expect(result.appointments[0].id).toBe('appointment-1');
      expect(result.cursor).toBe('next-page-cursor');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        result: {
          errors: [{ detail: 'Invalid location ID' }],
        },
      };

      mockBookingsApi.listBookings.mockResolvedValue(mockResponse);

      await expect(client.getAppointments()).rejects.toThrow(
        'Square API error: Invalid location ID'
      );
    });

    it('should handle network errors', async () => {
      mockBookingsApi.listBookings.mockRejectedValue(
        new Error('Network error')
      );

      await expect(client.getAppointments()).rejects.toThrow(
        'Failed to fetch appointments: Network error'
      );
    });

    it('should apply filters correctly', async () => {
      const mockResponse = {
        result: {
          bookings: [mockAppointment],
        },
      };

      mockBookingsApi.listBookings.mockResolvedValue(mockResponse);

      const filter = {
        startAtMin: '2024-01-15T00:00:00Z',
        startAtMax: '2024-01-16T00:00:00Z',
        teamMemberId: 'team-member-1',
        limit: 10,
      };

      await client.getAppointments(filter);

      expect(mockBookingsApi.listBookings).toHaveBeenCalledWith(
        10, // limit
        undefined, // cursor
        undefined, // customerId
        'team-member-1', // teamMemberId
        'test-location-id', // locationId
        '2024-01-15T00:00:00Z', // startAtMin
        '2024-01-16T00:00:00Z' // startAtMax
      );
    });
  });

  describe('getAppointmentById', () => {
    it('should fetch a single appointment successfully', async () => {
      const mockResponse = {
        result: {
          booking: mockAppointment,
        },
      };

      mockBookingsApi.retrieveBooking.mockResolvedValue(mockResponse);

      const result = await client.getAppointmentById('appointment-1');

      expect(result.id).toBe('appointment-1');
      expect(mockBookingsApi.retrieveBooking).toHaveBeenCalledWith(
        'appointment-1'
      );
    });

    it('should handle appointment not found', async () => {
      const mockResponse = {
        result: {
          booking: null,
        },
      };

      mockBookingsApi.retrieveBooking.mockResolvedValue(mockResponse);

      await expect(
        client.getAppointmentById('non-existent')
      ).rejects.toThrow('Appointment with ID non-existent not found');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        result: {
          errors: [{ detail: 'Unauthorized' }],
        },
      };

      mockBookingsApi.retrieveBooking.mockResolvedValue(mockResponse);

      await expect(
        client.getAppointmentById('appointment-1')
      ).rejects.toThrow('Square API error: Unauthorized');
    });
  });

  describe('getFutureAppointments', () => {
    it('should fetch future appointments with default days ahead', async () => {
      const mockResponse = {
        result: {
          bookings: [mockAppointment],
        },
      };

      mockBookingsApi.listBookings.mockResolvedValue(mockResponse);

      const result = await client.getFutureAppointments();

      expect(result.appointments).toHaveLength(1);
      expect(mockBookingsApi.listBookings).toHaveBeenCalledWith(
        undefined, // limit
        undefined, // cursor
        undefined, // customerId
        undefined, // teamMemberId
        'test-location-id', // locationId
        expect.any(String), // startAtMin
        expect.any(String) // startAtMax
      );
    });

    it('should fetch future appointments with custom days ahead', async () => {
      const mockResponse = {
        result: {
          bookings: [mockAppointment],
        },
      };

      mockBookingsApi.listBookings.mockResolvedValue(mockResponse);

      await client.getFutureAppointments(7);

      const call = mockBookingsApi.listBookings.mock.calls[0];
      const startAt = new Date(call[5]); // startAtMin parameter
      const endAt = new Date(call[6]); // startAtMax parameter
      const daysDiff = Math.ceil(
        (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBe(7);
    });
  });
});
