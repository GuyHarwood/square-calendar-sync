import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookingForm } from "@/components/booking-form"
import { Navigation } from "@/components/navigation"

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

async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching customers:", error)
    return []
  }

  return data || []
}

async function getServices(): Promise<Service[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, price")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching services:", error)
    return []
  }

  return data || []
}

export default async function BookAppointment() {
  const [customers, services] = await Promise.all([getCustomers(), getServices()])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground text-balance">Book New Appointment</h2>
          <p className="text-muted-foreground">Fill in the details to schedule a new appointment</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Schedule Appointment</CardTitle>
            <p className="text-muted-foreground">Choose customer, service, and preferred time</p>
          </CardHeader>
          <CardContent>
            <BookingForm customers={customers} services={services} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
