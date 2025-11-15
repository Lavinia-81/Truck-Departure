"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Route, Clock, Lightbulb, TrafficCone, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { suggestOptimizedRoute, type SuggestOptimizedRouteOutput } from '@/ai/flows/suggest-optimized-route';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

export default function RouteOptimizerPage() {
    const [start, setStart] = useState('Sky Gate Derby DE74 2BB');
    const [destination, setDestination] = useState('');
    const [via, setVia] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SuggestOptimizedRouteOutput | null>(null);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!destination) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Destination is required.',
            });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const res = await suggestOptimizedRoute({
                currentLocation: start,
                destination: destination,
                via: via || undefined,
                trafficData: 'Assume current conditions',
            });
            setResult(res);
        } catch (error: any) {
            console.error(error);
             let description = "Could not retrieve route. Please try again.";
             const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : String(error);

             if (errorMessage.includes('429')) {
                description = "You have reached the API request limit. Please wait one minute before trying again.";
            } else if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('permission')) {
                description = "The API key for the AI service is not valid or not configured. Check the .env file.";
            } else if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('is not found')) {
                description = "The AI model was not found. This might be a configuration issue. Please contact support."
            }

            toast({
                variant: 'destructive',
                title: 'Route Optimization Failed',
                description: description,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const level = result?.warningLevel || 'none';
    const warningConfig = warningLevels[level];
    const Icon = warningConfig.icon;


    return (
        <div className="flex-1 flex justify-center p-4 md:p-8">
            <div className="w-full max-w-4xl space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>AI Route Optimizer</CardTitle>
                        <CardDescription>
                            Enter the route details below and the AI will suggest the most efficient path based on real-time data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="start">Start Location</Label>
                                    <Input id="start" value={start} onChange={(e) => setStart(e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="destination">Final Destination</Label>
                                    <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g., London, UK" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="via">Via (Optional Stop)</Label>
                                <Input id="via" value={via} onChange={(e) => setVia(e.target.value)} placeholder="e.g., Birmingham, UK" />
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Route className="mr-2 h-4 w-4" />}
                                Optimize Route
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {isLoading && (
                    <Card>
                        <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-lg">Optimizing route, please wait...</p>
                        </CardContent>
                    </Card>
                )}

                {result && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Optimized Route Suggestion</CardTitle>
                             <CardDescription>
                                From <span className="font-semibold">{start}</span> to <span className="font-semibold">{destination}</span>
                                {via && <span className='italic'> via {via}</span>}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="flex items-start gap-4">
                                <div className={cn("p-2 rounded-full", warningConfig.bgColor)}>
                                    <Icon className={cn("h-6 w-6", warningConfig.color)} />
                                </div>
                                <div>
                                    <p className={cn("font-semibold", warningConfig.color)}>{warningConfig.title}</p>
                                    <p className="text-muted-foreground">{result.roadWarnings}</p>
                                    {level === 'severe' && (
                                        <Badge variant="destructive" className="mt-2">Action may be required</Badge>
                                    )}
                                    {level === 'moderate' && (
                                        <Badge variant="outline" className="mt-2 border-orange-400 text-orange-400">Caution Advised</Badge>
                                    )}
                                    {level === 'none' && (
                                    <Badge className="mt-2 bg-green-600/80 hover:bg-green-700">Route Clear</Badge>
                                    )}
                                </div>
                            </div>
                            <Separator/>
                            <div className="space-y-4">
                               <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-2 rounded-full"><Route className="h-6 w-6 text-primary" /></div>
                                    <div>
                                        <p className="font-semibold">Suggested Route</p>
                                        <p className="text-muted-foreground">{result.optimizedRoute}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-2 rounded-full"><Clock className="h-6 w-6 text-primary" /></div>
                                    <div>
                                        <p className="font-semibold">Estimated Time</p>
                                        <p className="text-muted-foreground">{result.estimatedTime}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-2 rounded-full"><Lightbulb className="h-6 w-6 text-primary" /></div>
                                    <div>
                                        <p className="font-semibold">AI Reasoning</p>
                                        <p className="text-muted-foreground">{result.reasoning}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
