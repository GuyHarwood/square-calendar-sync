"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, Home, Plus, Scissors } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/calendar",
      label: "Calendar",
      icon: Calendar,
      active: pathname === "/calendar",
    },
    {
      href: "/book",
      label: "Book Appointment",
      icon: Plus,
      active: pathname === "/book",
    },
  ]

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Salon Manager</h1>
              <p className="text-sm text-muted-foreground">Hair Stylist Dashboard</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    size="sm"
                    className={cn("gap-2", item.active && "bg-primary text-primary-foreground")}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
