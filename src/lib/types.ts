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
