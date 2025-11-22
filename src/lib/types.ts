import { z } from 'zod';

export const STATUSES = ['Waiting', 'Loading', 'Departed', 'Cancelled', 'Delayed'] as const;
export type Status = typeof STATUSES[number];

export const CARRIERS = ['Royal Mail', 'EVRI', 'Yodel', 'McBurney', 'Montgomery'] as const;
export type Carrier = typeof CARRIERS[number];

export interface Departure {
  id: string;
  carrier: Carrier;
  destination: string;
  via?: string;
  trailerNumber: string;
  collectionTime: string; // ISO string format for date and time
  bayDoor?: number | null;
  sealNumber?: string;
  driverName?: string;
  scheduleNumber: string;
  status: Status;
}

export interface AdminUser {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
}

// AI-related types
export const RoadStatusInputSchema = z.object({
  destination: z.string().describe('The final destination of the route, which is the assumed starting point for the driver returning to the depot.'),
  via: z.string().optional().describe('The first stop on the route, if applicable.'),
  collectionTime: z.string().describe("The truck's scheduled collection time in ISO format at the depot."),
});
export type RoadStatusInput = z.infer<typeof RoadStatusInputSchema>;

export const RoadStatusOutputSchema = z.object({
  optimizedRoute: z.string().describe('The suggested route from the starting location to the depot.'),
  estimatedTime: z.string().describe('The estimated time of arrival at the depot (Widnes, UK).'),
  reasoning: z.string().describe('The reasoning behind the time estimate, including analysis of traffic and weather.'),
  roadWarnings: z.string().optional().describe('A summary of any warnings, accidents, or significant traffic or weather issues on the suggested route. If there are no issues, this should state "No significant warnings."'),
  warningLevel: z.enum(['none', 'moderate', 'severe']).describe('A classification of the warning severity. "none" for no issues, "moderate" for traffic or minor delays, "severe" for accidents, road closures, or severe weather.'),
});
export type RoadStatusOutput = z.infer<typeof RoadStatusOutputSchema>;
