import Link from "next/link"
import { Route } from "lucide-react"
import Clock from "./clock"
import { Button } from "./ui/button"

export default function Header({ actions }: { actions?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-50 flex h-auto flex-col items-center gap-3 border-b bg-background px-4 py-3 md:px-6">
      {/* Main header for larger screens */}
      <div className="hidden w-full items-center md:flex">
        <div className="flex-1">
          {actions}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Truck Departure Dashboard
          </h1>
          <Clock />
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/optimize">
              <Route className="mr-2 h-4 w-4" />
              Route Optimizer
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="flex w-full flex-col items-center gap-3 md:hidden">
        <h1 className="text-xl font-bold tracking-tight">
          Truck Departure Dashboard
        </h1>
        <Clock />
        <div className="flex w-full flex-wrap items-center justify-center gap-2">
            {actions}
            <Button variant="outline" size="sm" asChild>
                <Link href="/optimize">
                <Route className="mr-2 h-4 w-4" />
                Optimizer
                </Link>
            </Button>
        </div>
      </div>
    </header>
  )
}
