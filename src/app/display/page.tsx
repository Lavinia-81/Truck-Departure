"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, Anchor, Building } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Departure, Status, Carrier } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import Clock from '@/components/clock';
import { STATUSES } from '@/lib/types';
import './scrolling-animation.css';

const statusColors: Record<Status, string> = {
  Departed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
  Loading: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
  Waiting: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
  Cancelled: 'bg-red-500 text-red-50 border-red-600 dark:bg-red-800/80 dark:text-red-100 dark:border-red-700',
  Delayed: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800',
};

interface CarrierStyle {
  className: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconUrl?: string;
}

const carrierStyles: Record<Carrier, CarrierStyle> = {
  'Royal Mail': { className: 'bg-red-500 hover:bg-red-600 text-white border-red-600', icon: Package },
  'EVRI': { className: 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600', icon: Truck },
  'Yodel': {
    className: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
    iconUrl: 'https://is2-ssl.mzstatic.com/image/thumb/Purple112/v4/c2/5d/ce/c25dce82-a611-5b02-4e4f-81b2d9d6ad97/AppIcon-0-0-1x_U007emarketing-0-0-0-10-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png'
  },
  'McBurney': { className: 'bg-purple-500 hover:bg-purple-600 text-white border-purple-600', icon: Anchor },
  'Montgomery': { className: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600', icon: Building },
};


export default function DisplayPage() {
  const firestore = useFirestore();
  const departuresCol = useMemoFirebase(() => firestore ? collection(firestore, 'dispatchSchedules') : null, [firestore]);
  const { data: departures, isLoading: isLoadingDepartures } = useCollection<Departure>(departuresCol);
  
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const sortedDepartures = useMemo(() => {
    if (!departures) return [];
    return [...departures].sort((a, b) => {
      const aTime = new Date(a.collectionTime).getTime();
      const bTime = new Date(b.collectionTime).getTime();
      return aTime - bTime;
    });
  }, [departures]);
  
  useEffect(() => {
    if (isLoadingDepartures || !tableContainerRef.current || !tableBodyRef.current) {
        return;
    }

    const checkOverflow = () => {
        const containerHeight = tableContainerRef.current?.clientHeight ?? 0;
        const contentHeight = tableBodyRef.current?.scrollHeight ?? 0;
        setIsScrolling(contentHeight > containerHeight);
    };

    checkOverflow();

    // Re-check on window resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [sortedDepartures, isLoadingDepartures]);


  const renderTableRows = (departuresToRender: Departure[]) => {
    return departuresToRender.map(d => {
        const carrierStyle = carrierStyles[d.carrier];
        const IconComponent = carrierStyle.icon;
        return (
          <TableRow key={d.id} className={cn('transition-colors h-16 md:h-20', statusColors[d.status])}>
            <TableCell>
              <Badge className={cn('flex items-center gap-2 text-base md:text-lg p-2', carrierStyle.className)}>
                {IconComponent && <IconComponent className="h-5 w-5 md:h-6 md:w-6" />}
                {carrierStyle.iconUrl && <Image src={carrierStyle.iconUrl} alt={`${d.carrier} logo`} width={24} height={24} className="rounded-sm" />}
                <span>{d.carrier}</span>
              </Badge>
            </TableCell>
            <TableCell>{d.via || '–'}</TableCell>
            <TableCell className="font-medium">{d.destination}</TableCell>
            <TableCell>{d.trailerNumber}</TableCell>
            <TableCell className="font-bold text-xl md:text-2xl">{format(parseISO(d.collectionTime), 'HH:mm')}</TableCell>
            <TableCell className="font-bold text-xl md:text-2xl">{d.bayDoor}</TableCell>
            <TableCell>
              <Badge variant="outline" className="border-current text-base md:text-lg p-2">
                {d.status}
              </Badge>
            </TableCell>
          </TableRow>
        );
      });
  }

  const animationDuration = useMemo(() => {
    // Adjust speed based on number of rows. ~20 seconds per row for slower animation.
    return sortedDepartures.length * 20;
  }, [sortedDepartures.length]);


  return (
    <div className="flex flex-col h-screen bg-background text-lg md:text-xl">
      <header className="flex flex-col items-center gap-2 border-b bg-background px-4 py-4 md:px-6 flex-shrink-0">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          Truck Departure Board
        </h1>
        <div className="text-xl md:text-2xl">
          <Clock />
        </div>
      </header>
      <main className="flex-1 flex flex-col space-y-4 p-4 md:p-8 pt-6 overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="p-2 md:p-4 flex-1 flex flex-col overflow-hidden">
            <div className="relative w-full overflow-hidden flex-1" ref={tableContainerRef}>
              <Table>
                <TableHeader className="bg-primary/90 text-xl md:text-2xl sticky top-0 z-10">
                  <TableRow className="border-primary/90 hover:bg-primary/90">
                    <TableHead className="text-primary-foreground">Carrier</TableHead>
                    <TableHead className="text-primary-foreground">Via</TableHead>
                    <TableHead className="text-primary-foreground">Destination</TableHead>
                    <TableHead className="text-primary-foreground">Trailer</TableHead>
                    <TableHead className="text-primary-foreground">Time</TableHead>
                    <TableHead className="text-primary-foreground">Bay</TableHead>
                    <TableHead className="text-primary-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                 <TableBody 
                    ref={tableBodyRef} 
                    className={cn("text-base md:text-lg", { 'scrolling-content': isScrolling })}
                    style={{ animationDuration: isScrolling ? `${animationDuration}s` : undefined }}
                  >
                    {isLoadingDepartures && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-48 text-2xl">
                          Loading Departures...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoadingDepartures && sortedDepartures.length > 0 ? (
                      <>
                       {renderTableRows(sortedDepartures)}
                       {isScrolling && renderTableRows(sortedDepartures)}
                      </>
                    ) : (
                      !isLoadingDepartures && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center h-48 text-2xl">
                            No Departures Scheduled
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
              </Table>
              <div className={cn("absolute inset-0 w-full h-full pointer-events-none", { 'scrolling-container': isScrolling })}></div>
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="border-t bg-background p-4 md:px-6 flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {STATUSES.map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn("h-4 w-4 rounded-full", statusColors[status])}></div>
                  <span>{status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </footer>
    </div>
  );
}
