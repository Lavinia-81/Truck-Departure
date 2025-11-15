"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type SuggestOptimizedRouteOutput } from "@/ai/flows/suggest-optimized-route";
import { Loader2, AlertCircle, CheckCircle, Clock, Map, Thermometer, Wind, Zap } from "lucide-react";

interface RouteStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: SuggestOptimizedRouteOutput | null;
  isLoading: boolean;
  error: string | null;
}

export function RouteStatusDialog({
  isOpen,
  onOpenChange,
  data,
  isLoading,
  error,
}: RouteStatusDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Route Optimization</DialogTitle>
          <DialogDescription>
            Real-time route analysis and traffic predictions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Analyzing route, traffic, and weather conditions...
              </p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="font-semibold">Analysis Failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
          {data && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Route Analysis for</p>
                <p className="text-lg font-bold">{data.route.destination}</p>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                        {data.recommendation.isOptimal ? (
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        ) : (
                            <AlertCircle className="h-10 w-10 text-orange-500" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold">
                            {data.recommendation.isOptimal ? "Route is Optimal" : "Suboptimal Route Detected"}
                        </h3>
                        <p className="text-sm text-muted-foreground">{data.recommendation.reason}</p>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3 rounded-lg border p-3">
                    <Clock className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div>
                        <p className="font-semibold">Estimated Travel Time</p>
                        <p className="text-muted-foreground">{data.route.estimatedTravelTime}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                    <Map className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                     <div>
                        <p className="font-semibold">Traffic Conditions</p>
                        <p className="text-muted-foreground">{data.traffic.condition}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3 rounded-lg border p-3">
                    <Zap className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                     <div>
                        <p className="font-semibold">Live Incidents</p>
                        <p className="text-muted-foreground">{data.traffic.incidents.length > 0 ? data.traffic.incidents.join(', ') : 'None reported'}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                    <Thermometer className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                     <div>
                        <p className="font-semibold">Weather</p>
                        <p className="text-muted-foreground">{data.weather.forecast} ({data.weather.temperature})</p>
                    </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
