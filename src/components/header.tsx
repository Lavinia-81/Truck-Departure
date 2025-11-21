"use client";

import * as React from "react";
import Link from "next/link";
import { Monitor, Menu, FileUp, FileDown, Users } from "lucide-react";
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
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/firebase/provider";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";

interface HeaderProps {
    onImport: () => void;
    onExport: () => void;
}

export default function Header({ onImport, onExport }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-auto items-center gap-4 border-b bg-card px-4 py-3 md:px-6">
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
              <Button variant="outline" onClick={onImport}><FileUp className="mr-2 h-4 w-4" /> Import</Button>
              <Button variant="outline" onClick={onExport}><FileDown className="mr-2 h-4 w-4" /> Export</Button>
          </div>
           <nav className="grid gap-4 text-lg font-medium mt-4">
            <Link href="/display" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
              <Monitor className="h-5 w-5" />
              Public Display
            </Link>
            <Link href="/admin/users" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                <Users className="h-5 w-5" />
                User Management
            </Link>
          </nav>
           <div className="mt-auto">
             <ThemeToggle />
           </div>
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
        <ThemeToggle />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || undefined} />
                  <AvatarFallback>
                    <UserIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                <Link href="/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  <span>User Management</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
