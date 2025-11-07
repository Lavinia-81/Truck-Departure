"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Caravan, Truck, Anchor, Building, Calendar, Clock as ClockIcon, Tag, MapPin, ChevronRight, DoorOpen, Ship, Route } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Departure, Status, Carrier } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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
  icon?: React.ReactNode;
  iconUrl?: string;
  logoClassName?: string;
}

const carrierStyles: Record<string, CarrierStyle> = {
  'Royal Mail': { className: 'bg-red-500 hover:bg-red-600 text-white border-red-600', icon: <Package className="h-5 w-5" /> },
  'EVRI': { 
    className: 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600', 
    icon: <Truck className="h-5 w-5 -scale-x-100" />
  },
  'The Very Group': {
    className: 'bg-black hover:bg-gray-800 text-white border-gray-800',
    iconUrl: 'https://marcommnews.com/wp-content/uploads/2020/05/1200px-Very-Group-Logo-2.svg_-1024x397.png',
    logoClassName: 'bg-white p-1 rounded-sm'
  },
  'Yodel': {
    className: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
    icon: <Truck className="h-5 w-5" />
  },
  'McBurney': { 
    className: 'bg-[#f1a10d] hover:bg-[#d98e0b] text-white border-[#d98e0b]', 
    icon: <Ship className="h-5 w-5" />
  },
  'Montgomery': { 
    className: 'bg-[#A5350D] hover:bg-[#8A2C0A] text-white border-[#8A2C0A]', 
    icon: <Route className="h-5 w-5" />
  },
};


export default function DisplayPage() {
  const firestore = useFirestore();
  const departuresQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'dispatchSchedules'), orderBy('collectionTime', 'asc'));
  }, [firestore]);
  const { data: departures, isLoading: isLoadingDepartures } = useCollection<Departure>(departuresQuery);
  
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
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
    
    // Use a small delay to allow the DOM to update before checking overflow.
    const timer = setTimeout(checkOverflow, 100);

    const debouncedCheckOverflow = () => setTimeout(checkOverflow, 100);

    window.addEventListener('resize', debouncedCheckOverflow);

    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', debouncedCheckOverflow);
    };
  }, [departures, isLoadingDepartures]);


  const renderTableRows = (departuresToRender: Departure[]) => {
    if (!departuresToRender || departuresToRender.length === 0) return null;
    return departuresToRender.map(d => {
        const carrierStyle = carrierStyles[d.carrier];
        return (
          <TableRow key={d.id} className={cn('transition-colors h-16 md:h-20', statusColors[d.status])}>
            <TableCell>
              <Badge className={cn('flex items-center gap-2 text-base md:text-lg p-2', carrierStyle?.className)}>
                {carrierStyle?.icon}
                 {carrierStyle?.iconUrl && (
                  <div className={carrierStyle.logoClassName}>
                    <Image src={carrierStyle.iconUrl} alt={`${d.carrier} logo`} width={24} height={24} className="h-auto w-6" />
                  </div>
                )}
                <span>{d.carrier}</span>
              </Badge>
            </TableCell>
            <TableCell>{d.via || '–'}</TableCell>
            <TableCell className="font-medium">{d.destination}</TableCell>
            <TableCell>{d.trailerNumber}</TableCell>
            <TableCell className="font-bold text-xl md:text-2xl">{format(parseISO(d.collectionTime), 'HH:mm')}</TableCell>
            <TableCell className="font-bold text-xl md:text-2xl">{d.bayDoor || 'N/A'}</TableCell>
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
    if (!departuresToRender || departuresToRender.length === 0) return null;
    return departuresToRender.map(d => {
      const carrierStyle = carrierStyles[d.carrier];
      return (
        <Card key={d.id} className={cn("mb-4 border-l-4", statusColors[d.status], `border-${statusColors[d.status].split(' ')[0]}`)}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Badge className={cn('flex items-center gap-2 text-base p-2', carrierStyle?.className)}>
                  {carrierStyle?.icon}
                  {carrierStyle?.iconUrl && (
                    <div className={carrierStyle.logoClassName}>
                      <Image src={carrierStyle.iconUrl} alt={`${d.carrier} logo`} width={20} height={20} className="h-auto w-5" />
                    </div>
                  )}
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
                <div className="flex items-center"><DoorOpen className="h-4 w-4 mr-2 text-muted-foreground" /> Bay <span className="font-bold text-base ml-2">{d.bayDoor || 'N/A'}</span></div>
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
    if (!departures) return 0;
    return departures.length * 15;
  }, [departures]);


  return (
    <div className="flex flex-col h-screen bg-background text-lg md:text-xl">
      <header className="flex items-center justify-between gap-4 border-b bg-background px-4 py-3 md:px-6 flex-shrink-0">
        <div className="bg-white p-2 rounded-md shadow-sm">
         <div className="w-[120px] h-auto">
            <Image src="https://marcommnews.com/wp-content/uploads/2020/05/1200px-Very-Group-Logo-2.svg_-1024x397.png" alt="The Very Group Logo" width={150} height={58} className="h-auto w-full" />
          </div>
        </div>
        <div className="flex flex-col items-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-center">
              Truck Departure Board
            </h1>
            <div className="text-xl md:text-2xl">
              <Clock />
            </div>
        </div>
        <div className="w-[120px]" /> 
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
                    ) : departures && departures.length > 0 ? (
                      <>
                       {renderTableRows(departures)}
                       {isScrolling && renderTableRows(departures)}
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
            ) : departures && departures.length > 0 ? (
              <>
                {renderMobileCards(departures)}
                {isScrolling && renderMobileCards(departures)}
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
