"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, Scissors, DollarSign, CheckCircle } from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
}

interface Appointment {
  id: string
  customer_id: string
  service_id: string
  appointment_date: string
  appointment_time: string
  status: string
  notes: string | null
}

interface EditAppointmentFormProps {
  appointment: Appointment
  customers: Customer[]
  services: Service[]
}

export function EditAppointmentForm({ appointment, customers, services }: EditAppointmentFormProps) {
  const [selectedCustomer, setSelectedCustomer] = useState(appointment.customer_id)
  const [selectedService, setSelectedService] = useState(appointment.service_id)
  const [appointmentDate, setAppointmentDate] = useState(appointment.appointment_date)
  const [appointmentTime, setAppointmentTime] = useState(appointment.appointment_time)
  const [status, setStatus] = useState(appointment.status)
  const [notes, setNotes] = useState(appointment.notes || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()

  const selectedServiceData = services.find((s) => s.id === selectedService)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!selectedCustomer || !selectedService || !appointmentDate || !appointmentTime) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          customer_id: selectedCustomer,
          service_id: selectedService,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: status,
          notes: notes.trim() || null,
        })
        .eq("id", appointment.id)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this appointment?")) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase.from("appointments").delete().eq("id", appointment.id)

      if (deleteError) throw deleteError

      router.push("/")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Generate time slots (9 AM to 6 PM, 15-minute intervals)
  const timeSlots = []
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 18 && minute > 0) break // Stop at 6:00 PM
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      timeSlots.push({ value: timeString, label: displayTime })
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0]

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Appointment Updated!</h3>
        <p className="text-muted-foreground text-center mb-4">
          The appointment has been successfully updated. Redirecting to dashboard...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection */}
      <div className="space-y-2">
        <Label htmlFor="customer" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Customer *
        </Label>
        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
          <SelectTrigger>
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{customer.name}</span>
                  {customer.phone && <span className="text-xs text-muted-foreground">{customer.phone}</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service Selection */}
      <div className="space-y-2">
        <Label htmlFor="service" className="flex items-center gap-2">
          <Scissors className="w-4 h-4" />
          Service *
        </Label>
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger>
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">{service.name}</span>
                    <span className="text-sm font-semibold">${service.price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{service.duration_minutes} minutes</span>
                    {service.description && <span>• {service.description}</span>}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedServiceData && (
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-md text-sm">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{selectedServiceData.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>${selectedServiceData.price}</span>
            </div>
          </div>
        )}
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date *
          </Label>
          <Input
            id="date"
            type="date"
            min={today}
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time *
          </Label>
          <Select value={appointmentTime} onValueChange={setAppointmentTime}>
            <SelectTrigger>
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no-show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any special requests or notes for this appointment..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={() => router.push("/")} className="flex-1">
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading} className="flex-1">
          {isLoading ? "Deleting..." : "Delete"}
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Updating..." : "Update Appointment"}
        </Button>
      </div>
    </form>
  )
}
