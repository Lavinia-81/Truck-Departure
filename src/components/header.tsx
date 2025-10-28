import Link from "next/link"
import { Truck } from "lucide-react"
import Clock from "./clock"
import { Separator } from "./ui/separator"
import { Button } from "./ui/button"

export default function Header() {
  return (
    <header className="sticky top-0 flex h-auto flex-col items-start gap-2 border-b bg-background px-4 py-3 md:px-6 z-50">
      <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Truck Departure Dashboard
          </h1>
          <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/optimize">
                  Route Optimizer
                </Link>
              </Button>
          </div>
      </div>
      <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
        <Clock />
        <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span>Depot Dispatch Display</span>
        </div>
      </div>
    </header>
  )
}
