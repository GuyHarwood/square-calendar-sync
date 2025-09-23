import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CalendarView } from "@/components/calendar-view"
import { Navigation } from "@/components/navigation"

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  notes: string | null
  customer: {
    name: string
    phone: string | null
  }
  service: {
    name: string
    duration_minutes: number
    price: number
  }
}

async function getMonthAppointments(year: number, month: number): Promise<Appointment[]> {
  const supabase = await createClient()

  // Get first and last day of the month
  const firstDay = new Date(year, month - 1, 1).toISOString().split("T")[0]
  const lastDay = new Date(year, month, 0).toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      notes,
      customer:customers(name, phone),
      service:services(name, duration_minutes, price)
    `)
    .gte("appointment_date", firstDay)
    .lte("appointment_date", lastDay)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })

  if (error) {
    console.error("Error fetching appointments:", error)
    return []
  }

  return data || []
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const params = await searchParams
  const currentDate = new Date()
  const year = params.year ? Number.parseInt(params.year) : currentDate.getFullYear()
  const month = params.month ? Number.parseInt(params.month) : currentDate.getMonth() + 1

  const appointments = await getMonthAppointments(year, month)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground text-balance">Calendar View</h2>
            <p className="text-muted-foreground">View and manage all your appointments</p>
          </div>
          <Link href="/book">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Appointment
            </Button>
          </Link>
        </div>

        <CalendarView appointments={appointments} currentYear={year} currentMonth={month} />
      </main>
    </div>
  )
}
