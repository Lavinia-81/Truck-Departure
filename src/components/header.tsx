import Link from "next/link";
import { Route, Monitor, Menu, PlusCircle, FileUp, FileDown } from "lucide-react";
import Clock from "./clock";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "./ui/separator";

interface HeaderProps {
    onImport: () => void;
    onExport: () => void;
    onAddNew: () => void;
}

export default function Header({ onImport, onExport, onAddNew }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-auto items-center gap-4 border-b bg-background px-4 py-3 md:px-6">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Actions</SheetTitle>
            <SheetDescription>
              Manage departures and app navigation.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 py-4">
              <Button onClick={onAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add Departure</Button>
              <Button variant="outline" onClick={onImport}><FileUp className="mr-2 h-4 w-4" /> Import</Button>
              <Button variant="outline" onClick={onExport}><FileDown className="mr-2 h-4 w-4" /> Export</Button>
          </div>
          <Separator />
           <nav className="grid gap-4 text-lg font-medium mt-4">
            <Link href="/display" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
              <Monitor className="h-5 w-5" />
              Public Display
            </Link>
            <Link href="/optimize" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
              <Route className="h-5 w-5" />
              Route Optimizer
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      
      <div className="flex flex-col items-start">
        <h1 className="text-lg font-bold tracking-tight md:text-2xl">
            Admin Dashboard
        </h1>
        <div className="hidden md:block">
            <Clock />
        </div>
      </div>

      <div className="md:hidden ml-auto">
        <Clock />
      </div>

      <div className="hidden items-center gap-4 ml-auto md:flex">
        <Button size="sm" variant="outline" onClick={onImport}>
            <FileUp className="mr-2 h-4 w-4" />
            Import
        </Button>
        <Button size="sm" variant="outline" onClick={onExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Export
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/display" target="_blank">
            <Monitor className="mr-2 h-4 w-4" />
            Public Display
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/optimize">
            <Route className="mr-2 h-4 w-4" />
            Route Optimizer
          </Link>
        </Button>
      </div>
    </header>
  );
}
