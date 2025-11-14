
"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ToggleDemoPage() {
  const [isToggled, setIsToggled] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-card-foreground">
          Exemplu Comutator (Toggle)
        </h1>
        <div className="flex items-center justify-between rounded-lg bg-muted p-4">
          <Label
            htmlFor="status-toggle"
            className={cn(
              "text-lg font-semibold transition-colors",
              isToggled ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isToggled ? "Activ" : "Inactiv"}
          </Label>
          <Switch
            id="status-toggle"
            checked={isToggled}
            onCheckedChange={setIsToggled}
            aria-label="Comută starea"
          />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Acesta este un exemplu de comutator stilizat.
        </p>
      </div>
    </div>
  );
}
