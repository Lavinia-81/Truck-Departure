"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { suggestOptimizedRoute, SuggestOptimizedRouteOutput } from "@/ai/flows/suggest-optimized-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Route, Clock, Lightbulb } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  currentLocation: z.string().min(3, "Current location is required."),
  destination: z.string().min(3, "Destination is required."),
  via: z.string().optional(),
  trafficData: z.string().optional(),
});

type OptimizerFormValues = z.infer<typeof formSchema>;

function RouteOptimizerPageContent() {
  const [result, setResult] = useState<SuggestOptimizedRouteOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OptimizerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentLocation: "Sky Gate Derby DE74 2BB",
      destination: "",
      via: "",
      trafficData: "Normal traffic conditions",
    },
  });

  async function onSubmit(data: OptimizerFormValues) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await suggestOptimizedRoute(data);
      setResult(response);
    } catch (e: any) {
      console.error(e);
      let errorMessage = "An unexpected error occurred. Please check the server console for more details.";
      if (e.message) {
        if (e.message.includes('429')) {
          errorMessage = "You have reached the API request limit. Please wait a minute before trying again or check your API key configuration.";
        } else if (e.message.toLowerCase().includes('api key')) {
          errorMessage = "Route optimization failed due to an API key issue. Ensure you have configured the GEMINI_API_KEY correctly in your .env file and that it is valid.";
        } else {
            errorMessage = `Route optimization failed: ${e.message}`;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Route Optimization</CardTitle>
          <CardDescription>Enter the route details to get an AI-powered optimized route suggestion.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="currentLocation" render={({ field }) => (<FormItem><FormLabel>Current Location</FormLabel><FormControl><Input placeholder="e.g., Sky Gate Derby DE74 2BB" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="destination" render={({ field }) => (<FormItem><FormLabel>Final Destination</FormLabel><FormControl><Input placeholder="e.g., Central London" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="via" render={({ field }) => (<FormItem><FormLabel>First Stop (Via)</FormLabel><FormControl><Input placeholder="e.g., Birmingham (optional)" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="trafficData" render={({ field }) => (<FormItem><FormLabel>Traffic Data</FormLabel><FormControl><Textarea placeholder="Provide any known traffic issues (optional)" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Route className="mr-2 h-4 w-4" />}
                Optimize Route
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center">
        {isLoading && (
          <div className="text-center text-muted-foreground">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4">Optimizing route...</p>
          </div>
        )}
        {error && <p className="text-destructive p-4 border border-destructive/50 rounded-md">{error}</p>}
        {result && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Optimized Route Suggestion</CardTitle>
              <CardDescription>Based on the information provided, here is the suggested route.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full"><Route className="h-6 w-6 text-primary" /></div>
                    <div>
                        <p className="font-semibold">Optimized Route</p>
                        <p className="text-muted-foreground">{result.optimizedRoute}</p>
                    </div>
                </div>
                <Separator/>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full"><Clock className="h-6 w-6 text-primary" /></div>
                    <div>
                        <p className="font-semibold">Estimated Time</p>
                        <p className="text-muted-foreground">{result.estimatedTime}</p>
                    </div>
                </div>
                <Separator/>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full"><Lightbulb className="h-6 w-6 text-primary" /></div>
                    <div>
                        <p className="font-semibold">Reasoning</p>
                        <p className="text-muted-foreground">{result.reasoning}</p>
                    </div>
                </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


export default function RouteOptimizerPage() {
    return (
        <RouteOptimizerPageContent />
    )
}
