"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator";
import type { Departure, RoadStatusOutput } from "@/lib/types"
import { Loader2, Route, Clock, Lightbulb, TrafficCone, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface RouteStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  departure: Departure | null;
  routeStatus: RoadStatusOutput | null;
  isLoading: boolean;
}

const warningLevels = {
    severe: {
        icon: AlertTriangle,
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        badge: "destructive",
        title: "Severe Warnings"
    },
    moderate: {
        icon: TrafficCone,
        color: "text-orange-400",
        bgColor: "bg-orange-400/10",
        badge: "default",
        title: "Moderate Warnings"
    },
    none: {
        icon: CheckCircle2,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        badge: "default",
        title: "Route Clear"
    }
} as const;


export function RouteStatusDialog({ isOpen, onOpenChange, departure, routeStatus, isLoading }: RouteStatusDialogProps) {
  
  const level = routeStatus?.warningLevel || 'none';
  const warningConfig = warningLevels[level];
  const Icon = warningConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Route Status: {departure?.destination.toUpperCase()}</DialogTitle>
          <DialogDescription>
            Real-time traffic analysis from The Very Group depot to {departure?.destination}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
            {isLoading && (
                <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground min-h-[300px]">
                    <Loader2 className="h-10 w-10 animate-spin text-primary"/>
                    <p>Performing real-time analysis...</p>
                    <p className="text-sm text-center max-w-sm">Checking live traffic, weather, and incidents between the depot and {departure?.destination}.</p>
                </div>
            )}
            {!isLoading && routeStatus && (
                <>
                <div className="flex items-start gap-4">
                    <div className={cn("p-2 rounded-full", warningConfig.bgColor)}>
                        <Icon className={cn("h-6 w-6", warningConfig.color)} />
                    </div>
                    <div>
                        <p className={cn("font-semibold", warningConfig.color)}>{warningConfig.title}</p>
                        <p className="text-muted-foreground">{routeStatus.roadWarnings}</p>
                        {level === 'severe' && (
                            <Badge variant="destructive" className="mt-2">Potential Delay</Badge>
                        )}
                         {level === 'moderate' && (
                            <Badge variant="outline" className="mt-2 border-orange-400 text-orange-400">Caution Advised</Badge>
                        )}
                        {level === 'none' && (
                           <Badge className="mt-2 bg-green-600/80 hover:bg-green-700">On Time</Badge>
                        )}
                    </div>
                </div>
                <Separator/>
                <div className="grid gap-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-2 rounded-full"><MapPin className="h-6 w-6 text-primary" /></div>
                        <div>
                            <p className="font-semibold">Optimized Route</p>
                            <p className="text-muted-foreground">{routeStatus.optimizedRoute}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-2 rounded-full"><Clock className="h-6 w-6 text-primary" /></div>
                        <div>
                            <p className="font-semibold">Estimated Travel Time</p>
                            <p className="text-muted-foreground">{routeStatus.estimatedTime}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-2 rounded-full"><Lightbulb className="h-6 w-6 text-primary" /></div>
                        <div>
                            <p className="font-semibold">AI Reasoning</p>
                            <p className="text-muted-foreground">{routeStatus.reasoning}</p>
                        </div>
                    </div>
                </div>
                </>
            )}
            {!isLoading && !routeStatus && (
                <div className="flex flex-col items-center justify-center gap-4 text-destructive min-h-[300px]">
                     <AlertTriangle className="h-10 w-10 "/>
                    <p className="font-semibold text-lg">Analysis Failed</p>
                    <p className="text-sm text-center text-muted-foreground max-w-sm">Could not retrieve traffic analysis. Please check the logs or try again later.</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
