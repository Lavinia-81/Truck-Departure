"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, Anchor, Building, Calendar, Clock as ClockIcon, Tag, MapPin, ChevronRight, DoorOpen } from 'lucide-react';
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
  Loading: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900/50 dark:text-fuchsia-300 dark:border-fuchsia-800',
  Waiting: 'bg-blue-800 text-white border-blue-900 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
  Cancelled: 'bg-red-500 text-red-50 border-red-600 dark:bg-red-800/80 dark:text-red-100 dark:border-red-700',
  Delayed: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800',
};

interface CarrierStyle {
  className: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconUrl?: string;
}

const carrierStyles: Record<string, CarrierStyle> = {
  'Royal Mail': { className: 'bg-red-500 hover:bg-red-600 text-white border-red-600', icon: Package },
  'EVRI': { className: 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600', icon: Truck },
  'Yodel': {
    className: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
    iconUrl: 'https://is2-ssl.mzstatic.com/image/thumb/Purple112/v4/c2/5d/ce/c25dce82-a611-5b02-4e4f-81b2d9d6ad97/AppIcon-0-0-1x_U007emarketing-0-0-0-10-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png'
  },
  'McBurney': { className: 'bg-purple-500 hover:bg-purple-600 text-white border-purple-600', icon: Anchor },
  'Montgomery': { className: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600', icon: Building },
  'The Very Group': {
    className: 'bg-black hover:bg-neutral-800 text-white border-neutral-700',
    iconUrl: 'https://marcommnews.com/wp-content/uploads/2020/05/1200px-Very-Group-Logo-2.svg_-1024x397.png'
  }
};


export default function DisplayPage() {
  const firestore = useFirestore();
  const departuresCol = useMemoFirebase(() => firestore ? collection(firestore, 'dispatchSchedules') : null, [firestore]);
  const { data: departures, isLoading: isLoadingDepartures } = useCollection<Departure>(departuresCol);
  
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
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
    if (isLoadingDepartures) return;

    const checkOverflow = () => {
        const isMobile = window.innerWidth < 768;
        const container = isMobile ? mobileContainerRef.current : tableContainerRef.current;
        const content = isMobile ? container?.firstChild as HTMLElement : tableBodyRef.current;
        
        if (container && content) {
            const containerHeight = container.clientHeight;
            const contentHeight = content.scrollHeight;
            setIsScrolling(contentHeight > containerHeight);
        } else {
            setIsScrolling(false);
        }
    };

    checkOverflow();
    const debouncedCheckOverflow = () => setTimeout(checkOverflow, 100);

    window.addEventListener('resize', debouncedCheckOverflow);
    return () => window.removeEventListener('resize', debouncedCheckOverflow);
  }, [sortedDepartures, isLoadingDepartures]);


  const renderTableRows = (departuresToRender: Departure[]) => {
    return departuresToRender.map(d => {
        const carrierStyle = carrierStyles[d.carrier];
        const IconComponent = carrierStyle?.icon;
        return (
          <TableRow key={d.id} className={cn('transition-colors h-16 md:h-20', statusColors[d.status])}>
            <TableCell>
              <Badge className={cn('flex items-center gap-2 text-base md:text-lg p-2', carrierStyle?.className)}>
                {IconComponent && <IconComponent className="h-5 w-5 md:h-6 md:w-6" />}
                {carrierStyle?.iconUrl && <Image src={carrierStyle.iconUrl} alt={`${d.carrier} logo`} width={24} height={24} className="rounded-sm" />}
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

  const renderMobileCards = (departuresToRender: Departure[]) => {
    return departuresToRender.map(d => {
      const carrierStyle = carrierStyles[d.carrier];
      const IconComponent = carrierStyle?.icon;
      return (
        <Card key={d.id} className={cn("mb-4 border-l-4", statusColors[d.status], `border-${statusColors[d.status].split(' ')[0]}`)}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Badge className={cn('flex items-center gap-2 text-base p-2', carrierStyle?.className)}>
                  {IconComponent && <IconComponent className="h-5 w-5" />}
                  {carrierStyle?.iconUrl && <Image src={carrierStyle.iconUrl} alt={`${d.carrier} logo`} width={20} height={20} className="rounded-sm" />}
                  <span>{d.carrier}</span>
              </Badge>
              <Badge variant="outline" className="border-current text-base p-2">{d.status}</Badge>
            </div>
            <div className='flex items-center text-lg'>
                <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                <span className="font-medium">{d.destination}</span>
                {d.via && <><ChevronRight className="h-5 w-5 mx-2 text-muted-foreground" /> <span className='text-muted-foreground text-base'>{d.via}</span></>}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center"><ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-bold text-base">{format(parseISO(d.collectionTime), 'HH:mm')}</span></div>
                <div className="flex items-center"><DoorOpen className="h-4 w-4 mr-2 text-muted-foreground" /> Bay <span className="font-bold text-base ml-2">{d.bayDoor}</span></div>
                <div className="flex items-center"><Tag className="h-4 w-4 mr-2 text-muted-foreground" /> {d.trailerNumber}</div>
                {d.sealNumber && <div className="flex items-center"><Tag className="h-4 w-4 mr-2 text-muted-foreground" /> {d.sealNumber}</div>}
            </div>
          </CardContent>
        </Card>
      )
    });
  };

  const animationDuration = useMemo(() => {
    // Adjust speed based on number of rows. ~15 seconds per item.
    return sortedDepartures.length * 15;
  }, [sortedDepartures.length]);


  return (
    <div className="flex flex-col h-screen bg-background text-lg md:text-xl">
      <header className="flex items-center justify-between gap-4 border-b bg-background px-4 py-3 md:px-6 flex-shrink-0">
        <div className="bg-white p-2 rounded-md shadow-sm">
         <Image src="https://marcommnews.com/wp-content/uploads/2020/05/1200px-Very-Group-Logo-2.svg_-1024x397.png" alt="The Very Group Logo" width={120} height={46} className="h-auto" />
        </div>
        <div className="flex flex-col items-end">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Truck Departure Board
            </h1>
            <div className="text-xl md:text-2xl">
              <Clock />
            </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col space-y-4 p-2 md:p-8 pt-6 overflow-hidden">
        {/* Desktop View (Table) */}
        <Card className="hidden md:flex flex-1 flex-col overflow-hidden">
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
                    {isLoadingDepartures ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-48 text-2xl">
                          Loading Departures...
                        </TableCell>
                      </TableRow>
                    ) : sortedDepartures.length > 0 ? (
                      <>
                       {renderTableRows(sortedDepartures)}
                       {isScrolling && renderTableRows(sortedDepartures)}
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-48 text-2xl">
                          No Departures Scheduled
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
              </Table>
              <div className={cn("absolute inset-0 w-full h-full pointer-events-none", { 'scrolling-container': isScrolling })}></div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile View (Cards) */}
        <div ref={mobileContainerRef} className="md:hidden flex-1 overflow-y-auto space-y-4 relative">
          <div 
            className={cn({ 'scrolling-content': isScrolling })}
            style={{ animationDuration: isScrolling ? `${animationDuration}s` : undefined }}>
            {isLoadingDepartures ? (
              <p className="text-center text-muted-foreground p-8">Loading Departures...</p>
            ) : sortedDepartures.length > 0 ? (
              <>
                {renderMobileCards(sortedDepartures)}
                {isScrolling && renderMobileCards(sortedDepartures)}
              </>
            ) : (
              <p className="text-center text-muted-foreground p-8">No Departures Scheduled</p>
            )}
          </div>
           <div className={cn("absolute inset-0 w-full h-full pointer-events-none", { 'scrolling-container': isScrolling })}></div>
        </div>
      </main>
      <footer className="sticky bottom-0 border-t bg-background px-4 py-2 md:px-6 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm md:text-base">
            <span className="font-semibold text-base md:text-lg mr-2 md:mr-4">Legend:</span>
            {STATUSES.map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div className={cn("h-3 w-3 md:h-4 md:w-4 rounded-full", statusColors[status])}></div>
                <span>{status}</span>
              </div>
            ))}
          </div>
      </footer>
    </div>
  );
}
