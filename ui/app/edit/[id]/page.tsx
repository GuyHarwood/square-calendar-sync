import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { EditAppointmentForm } from "@/components/edit-appointment-form"
import { notFound } from "next/navigation"

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

async function getAppointment(id: string): Promise<Appointment | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("appointments").select("*").eq("id", id).single()

  if (error || !data) {
    return null
  }

  return data
}

async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("customers").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error fetching customers:", error)
    return []
  }

  return data || []
}

async function getServices(): Promise<Service[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("services").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error fetching services:", error)
    return []
  }

  return data || []
}

export default async function EditAppointmentPage({ params }: { params: { id: string } }) {
  const appointment = await getAppointment(params.id)

  if (!appointment) {
    notFound()
  }

  const [customers, services] = await Promise.all([getCustomers(), getServices()])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground text-balance">Edit Appointment</h2>
            <p className="text-muted-foreground">Update appointment details and status</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <EditAppointmentForm appointment={appointment} customers={customers} services={services} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
