"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Route, Clock, AlertTriangle, ShieldCheck } from "lucide-react"
import type { Departure } from "@/lib/types"
import type { RoadStatusOutput } from '@/ai/flows/road-status.flow';

interface RouteStatusDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  departure: Departure | null
  routeStatus: RoadStatusOutput | null
  isLoading: boolean
}

const warningLevelColors = {
  none: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800",
  severe: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800",
};

const warningLevelIcons = {
    none: <ShieldCheck className="h-5 w-5 text-green-500" />,
    moderate: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    severe: <AlertTriangle className="h-5 w-5 text-red-500" />,
}

export function RouteStatusDialog({
  isOpen,
  onOpenChange,
  departure,
  routeStatus,
  isLoading,
}: RouteStatusDialogProps) {
  
  const getTrafficSummary = () => {
    if (!routeStatus) {
        if (isLoading) return "Analyzing route...";
        return "Could not retrieve road status.";
    }
    return routeStatus.roadWarnings || "No significant warnings.";
  };
  
  const getEta = () => {
      if (!routeStatus) return "Unknown";
      return routeStatus.estimatedTime;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            AI Road Status: {departure?.destination.toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Real-time traffic analysis from The Very Group to {departure?.destination}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
            {isLoading && (
                 <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Analyzing traffic data...</p>
                </div>
            )}

            {!isLoading && routeStatus && (
                 <Alert className={warningLevelColors[routeStatus.warningLevel]}>
                    {warningLevelIcons[routeStatus.warningLevel]}
                    <AlertTitle>Traffic Summary</AlertTitle>
                    <AlertDescription>
                        {getTrafficSummary()}
                    </AlertDescription>
                </Alert>
            )}
            
             {!isLoading && !routeStatus && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Analysis Failed</AlertTitle>
                    <AlertDescription>
                        Could not retrieve traffic analysis. Please check the logs or try again later.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 grid-cols-2">
                <div className="flex flex-col gap-1 rounded-lg border p-3">
                    <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Estimated Time of Arrival (ETA)
                    </dt>
                    <dd className="text-xl font-semibold">{getEta()}</dd>
                </div>
                 <div className="flex flex-col gap-1 rounded-lg border p-3">
                    <dt className="text-sm font-medium text-muted-foreground">Warning Level</dt>
                    <dd className="text-xl font-semibold capitalize">
                        <Badge variant="outline" className={routeStatus ? warningLevelColors[routeStatus.warningLevel] : ""}>
                            {routeStatus?.warningLevel || 'N/A'}
                        </Badge>
                    </dd>
                </div>
            </div>

            {routeStatus?.optimizedRoute && (
                <div className="space-y-2">
                    <h3 className="font-semibold">Suggested Route</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{routeStatus.optimizedRoute}</p>
                </div>
            )}
             {routeStatus?.reasoning && (
                <div className="space-y-2">
                    <h3 className="font-semibold">Reasoning</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{routeStatus.reasoning}</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
