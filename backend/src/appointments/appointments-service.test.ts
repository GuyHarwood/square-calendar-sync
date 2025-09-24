import { AppointmentsService } from './appointments-service'
import { SquareAppointmentsClient } from './square-client'
import { SquareConfig, SquareAppointment } from './types'

jest.mock('./square-client')

const mockConfig: SquareConfig = {
  daysAhead: 30,
  accessToken: 'test-token',
  applicationId: 'test-app-id',
  locationId: 'test-location-id',
  environment: 'sandbox',
}

const mockAppointment: SquareAppointment = {
  id: 'appointment-1',
  locationId: 'test-location-id',
  status: 'ACCEPTED',
  startAt: '2024-01-15T10:00:00Z',
  appointmentSegments: [
    {
      durationMinutes: 60,
      serviceVariation: {
        itemVariationId: 'service-1',
        version: 1,
      },
      teamMemberId: 'team-member-1',
      intermissionMinutes: 15,
    },
  ],
  version: 1,
  createdAt: '2024-01-10T08:00:00Z',
  updatedAt: '2024-01-10T08:00:00Z',
  source: 'FIRST_PARTY_MERCHANT',
}

const mockCancelledAppointment: SquareAppointment = {
  ...mockAppointment,
  id: 'appointment-2',
  status: 'CANCELLED',
}

const mockUndefinedStatusAppointment: SquareAppointment = {
  ...mockAppointment,
  id: 'appointment-3',
  status: undefined,
}

describe('AppointmentsService', () => {
  let service: AppointmentsService
  let mockSquareClient: jest.Mocked<SquareAppointmentsClient>

  beforeEach(() => {
    mockSquareClient = {
      getAppointments: jest.fn(),
      getAppointmentById: jest.fn(),
      getFutureAppointments: jest.fn(),
    } as any

    ;(
      SquareAppointmentsClient as jest.MockedClass<
        typeof SquareAppointmentsClient
      >
    ).mockImplementation(() => mockSquareClient)

    service = new AppointmentsService(mockConfig)
  })

  describe('getAllFutureAppointments', () => {
    it('should fetch all future appointments and filter active ones', async () => {
      mockSquareClient.getFutureAppointments.mockResolvedValue({
        appointments: [
          mockAppointment,
          mockCancelledAppointment,
          mockUndefinedStatusAppointment,
        ],
        cursor: undefined,
      })

      const result = await service.getAllFutureAppointments()

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('appointment-1')
      expect(result[0].status).toBe('ACCEPTED')
      expect(result[1].id).toBe('appointment-3')
      expect(result[1].status).toBe(undefined)
    })

    it('should handle pagination', async () => {
      mockSquareClient.getFutureAppointments
        .mockResolvedValueOnce({
          appointments: [mockAppointment],
          cursor: 'page-2',
        })
        .mockResolvedValueOnce({
          appointments: [{ ...mockAppointment, id: 'appointment-3' }],
          cursor: undefined,
        })

      const result = await service.getAllFutureAppointments()

      expect(result).toHaveLength(2)
      expect(mockSquareClient.getFutureAppointments).toHaveBeenCalledTimes(2)
    })

    it('should handle errors', async () => {
      mockSquareClient.getFutureAppointments.mockRejectedValue(
        new Error('API Error')
      )

      await expect(service.getAllFutureAppointments()).rejects.toThrow(
        'Failed to retrieve future appointments: API Error'
      )
    })
  })

  describe('getAppointmentsByDateRange', () => {
    it('should fetch appointments within date range', async () => {
      const startDate = new Date('2024-01-15T00:00:00Z')
      const endDate = new Date('2024-01-16T00:00:00Z')

      mockSquareClient.getAppointments.mockResolvedValue({
        appointments: [mockAppointment],
        cursor: undefined,
      })

      const result = await service.getAppointmentsByDateRange(
        startDate,
        endDate
      )

      expect(result).toHaveLength(1)
      expect(mockSquareClient.getAppointments).toHaveBeenCalledWith({
        startAtMin: startDate.toISOString(),
        startAtMax: endDate.toISOString(),
        cursor: undefined,
      })
    })

    it('should handle pagination for date range', async () => {
      const startDate = new Date('2024-01-15T00:00:00Z')
      const endDate = new Date('2024-01-16T00:00:00Z')

      mockSquareClient.getAppointments
        .mockResolvedValueOnce({
          appointments: [mockAppointment],
          cursor: 'page-2',
        })
        .mockResolvedValueOnce({
          appointments: [{ ...mockAppointment, id: 'appointment-3' }],
          cursor: undefined,
        })

      const result = await service.getAppointmentsByDateRange(
        startDate,
        endDate
      )

      expect(result).toHaveLength(2)
      expect(mockSquareClient.getAppointments).toHaveBeenCalledTimes(2)
    })
  })

  describe('getAppointmentById', () => {
    it('should fetch a single appointment by ID', async () => {
      mockSquareClient.getAppointmentById.mockResolvedValue(mockAppointment)

      const result = await service.getAppointmentById('appointment-1')

      expect(result).toEqual(mockAppointment)
      expect(mockSquareClient.getAppointmentById).toHaveBeenCalledWith(
        'appointment-1'
      )
    })

    it('should handle errors when fetching by ID', async () => {
      mockSquareClient.getAppointmentById.mockRejectedValue(
        new Error('Not found')
      )

      await expect(service.getAppointmentById('non-existent')).rejects.toThrow(
        'Failed to retrieve appointment non-existent: Not found'
      )
    })
  })

  describe('getAppointmentsByTeamMember', () => {
    it('should fetch appointments for a specific team member', async () => {
      mockSquareClient.getAppointments.mockResolvedValue({
        appointments: [mockAppointment],
        cursor: undefined,
      })

      const result = await service.getAppointmentsByTeamMember('team-member-1')

      expect(result).toHaveLength(1)
      expect(mockSquareClient.getAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          teamMemberId: 'team-member-1',
          startAtMin: expect.any(String),
          startAtMax: expect.any(String),
        })
      )
    })
  })

  describe('utility methods', () => {
    describe('isAppointmentActive', () => {
      it('should return true for accepted appointments', () => {
        expect(service.isAppointmentActive(mockAppointment)).toBe(true)
      })

      it('should return true for pending appointments', () => {
        const pendingAppointment = {
          ...mockAppointment,
          status: 'PENDING' as const,
        }
        expect(service.isAppointmentActive(pendingAppointment)).toBe(true)
      })

      it('should return false for cancelled appointments', () => {
        expect(service.isAppointmentActive(mockCancelledAppointment)).toBe(
          false
        )
      })
    })

    describe('getAppointmentDuration', () => {
      it('should calculate total duration including intermissions', () => {
        const duration = service.getAppointmentDuration(mockAppointment)
        expect(duration).toBe(75) // 60 minutes + 15 intermission
      })

      it('should handle appointments without intermissions', () => {
        const appointmentNoIntermission = {
          ...mockAppointment,
          appointmentSegments: [
            {
              ...mockAppointment.appointmentSegments[0],
              intermissionMinutes: undefined,
            },
          ],
        }
        const duration = service.getAppointmentDuration(
          appointmentNoIntermission
        )
        expect(duration).toBe(60)
      })

      it('should calculate duration for multiple segments', () => {
        const multiSegmentAppointment = {
          ...mockAppointment,
          appointmentSegments: [
            mockAppointment.appointmentSegments[0],
            {
              durationMinutes: 30,
              serviceVariation: {
                itemVariationId: 'service-2',
                version: 1,
              },
              teamMemberId: 'team-member-2',
              intermissionMinutes: 10,
            },
          ],
        }
        const duration = service.getAppointmentDuration(multiSegmentAppointment)
        expect(duration).toBe(115) // 60 + 15 + 30 + 10
      })
    })

    describe('getAppointmentEndTime', () => {
      it('should calculate correct end time', () => {
        const endTime = service.getAppointmentEndTime(mockAppointment)
        const expectedEndTime = new Date('2024-01-15T11:15:00Z') // 10:00 + 75 minutes

        expect(endTime).toEqual(expectedEndTime)
      })
    })
  })
})
