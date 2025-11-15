"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  suggestOptimizedRoute,
  type SuggestOptimizedRouteOutput,
} from "@/ai/flows/suggest-optimized-route";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal } from "lucide-react";

export default function OptimizePage() {
  const [destination, setDestination] = useState("Manchester");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SuggestOptimizedRouteOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const output = await suggestOptimizedRoute({
        destination,
        collectionTime: new Date().toISOString(),
      });
      setResult(output);
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>AI Route Optimizer</CardTitle>
            <CardDescription>
              Enter a destination to get a real-time route analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., London"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLoading ? "Analyzing..." : "Optimize Route"}
            </Button>
          </CardFooter>
        </form>

        {result && (
          <div className="border-t p-6">
            <h3 className="mb-4 text-lg font-semibold">Analysis Result</h3>
            <div className="space-y-4 text-sm">
              <p>
                <strong>Destination:</strong> {result.route.destination}
              </p>
              <p>
                <strong>Travel Time:</strong> {result.route.estimatedTravelTime}
              </p>
              <p>
                <strong>Traffic:</strong> {result.traffic.condition}
              </p>
              <p>
                <strong>Incidents:</strong>{" "}
                {result.traffic.incidents.length > 0
                  ? result.traffic.incidents.join(", ")
                  : "None"}
              </p>
              <p>
                <strong>Weather:</strong> {result.weather.forecast} (
                {result.weather.temperature})
              </p>
              <div
                className={`mt-4 rounded-md p-3 ${
                  result.recommendation.isOptimal
                    ? "bg-green-100 text-green-900 dark:bg-green-900/50 dark:text-green-200"
                    : "bg-orange-100 text-orange-900 dark:bg-orange-900/50 dark:text-orange-200"
                }`}
              >
                <p className="font-bold">
                  {result.recommendation.isOptimal
                    ? "Recommendation: Optimal Route"
                    : "Recommendation: Suboptimal Route"}
                </p>
                <p>{result.recommendation.reason}</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
