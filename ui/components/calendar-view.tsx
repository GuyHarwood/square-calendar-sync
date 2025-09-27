"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, User, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  notes: string | null
  customers: {
    name: string
    phone: string | null
  } | null
  services: {
    name: string
    duration_minutes: number
    price: number
  } | null
}

interface CalendarViewProps {
  appointments: Appointment[]
  currentYear: number
  currentMonth: number
}

export function CalendarView({ appointments, currentYear, currentMonth }: CalendarViewProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Get appointments grouped by date
  const appointmentsByDate = appointments.reduce(
    (acc, appointment) => {
      const date = appointment.appointment_date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(appointment)
      return acc
    },
    {} as Record<string, Appointment[]>,
  )

  // Get calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    let newMonth = currentMonth
    let newYear = currentYear

    if (direction === "prev") {
      newMonth = currentMonth === 1 ? 12 : currentMonth - 1
      newYear = currentMonth === 1 ? currentYear - 1 : currentYear
    } else {
      newMonth = currentMonth === 12 ? 1 : currentMonth + 1
      newYear = currentMonth === 12 ? currentYear + 1 : currentYear
    }

    router.push(`/calendar?year=${newYear}&month=${newMonth}`)
  }

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":")
    const date = new Date()
    date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getDateString = (day: number): string => {
    return `${currentYear}-${currentMonth.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
  }

  const selectedDateAppointments = selectedDate ? appointmentsByDate[selectedDate] || [] : []

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          {monthNames[currentMonth - 1]} {currentYear}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {daysOfWeek.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="p-2 h-20" />
                  }

                  const dateString = getDateString(day)
                  const dayAppointments = appointmentsByDate[dateString] || []
                  const isToday =
                    new Date().toDateString() === new Date(currentYear, currentMonth - 1, day).toDateString()
                  const isSelected = selectedDate === dateString

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDate(isSelected ? null : dateString)}
                      className={cn(
                        "p-2 h-20 border rounded-md text-left hover:bg-muted/50 transition-colors",
                        isToday && "bg-primary/10 border-primary/20",
                        isSelected && "bg-primary/20 border-primary",
                        dayAppointments.length > 0 && "border-accent",
                      )}
                    >
                      <div className="text-sm font-medium text-foreground">{day}</div>
                      {dayAppointments.length > 0 && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {dayAppointments.length}
                          </Badge>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate
                  ? new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                  : "Select a Date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                selectedDateAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateAppointments.map((appointment) => (
                      <div key={appointment.id} className="p-3 border rounded-md">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{appointment.customers?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/edit/${appointment.id}`}>
                              <Button variant="outline" size="sm" className="h-6 px-2 bg-transparent">
                                <Edit className="w-3 h-3" />
                              </Button>
                            </Link>
                            <Badge
                              variant={appointment.status === "scheduled" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(appointment.appointment_time)}</span>
                          </div>
                          <div>{appointment.services?.name || 'Unknown Service'}</div>
                          <div className="font-medium text-foreground">${appointment.services?.price || '0'}</div>
                        </div>

                        {appointment.notes && (
                          <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No appointments scheduled for this date.</p>
                )
              ) : (
                <p className="text-muted-foreground text-sm">Click on a date to view appointments.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
