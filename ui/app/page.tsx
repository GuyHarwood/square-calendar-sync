import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, User, Scissors, Edit } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"

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

async function getUpcomingAppointments(): Promise<Appointment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      notes,
      customers(name, phone),
      services(name, duration_minutes, price)
    `)
    .gte("appointment_date", new Date().toISOString().split("T")[0])
    .eq("status", "scheduled")
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .limit(5)

  if (error) {
    console.error("Error fetching appointments:", error)
    return []
  }

  return (data as unknown as Appointment[]) || []
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(":")
  const date = new Date()
  date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export default async function Dashboard() {
  const appointments = await getUpcomingAppointments()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground text-balance">Today&apos;s Schedule</h2>
            <p className="text-muted-foreground">Manage your upcoming appointments</p>
          </div>
          <Link href="/book">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Appointment
            </Button>
          </Link>
        </div>

        {/* Upcoming Appointments */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Next 5 Appointments</h3>

          {appointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No upcoming appointments</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You don&apos;t have any scheduled appointments. Book a new one to get started.
                </p>
                <Link href="/book">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{appointment.customers?.name || 'Unknown'}</h4>
                            {appointment.customers?.phone && (
                              <p className="text-sm text-muted-foreground">{appointment.customers?.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{formatDate(appointment.appointment_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{formatTime(appointment.appointment_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{appointment.services?.name || 'Unknown Service'}</span>
                          </div>
                        </div>

                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                            {appointment.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4">
                        <Link href={`/edit/${appointment.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                        </Link>
                        <Badge variant="secondary" className="text-xs">
                          {appointment.services?.duration_minutes || 0}min
                        </Badge>
                        <span className="text-lg font-semibold text-foreground">${appointment.services?.price || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$240</div>
              <p className="text-xs text-muted-foreground mt-1">+12% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Appointments Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">6</div>
              <p className="text-xs text-muted-foreground mt-1">2 completed, 4 remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">28</div>
              <p className="text-xs text-muted-foreground mt-1">appointments scheduled</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
