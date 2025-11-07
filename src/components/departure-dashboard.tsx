"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Edit, Caravan, Truck, Package, Anchor, Building, Trash2, TrafficCone, AlertTriangle, CheckCircle2, PlusCircle, Ship, Route } from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';
import type { Departure, Status, Carrier } from '@/lib/types';
import { EditDepartureDialog } from './edit-departure-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Header from './header';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, getDocs, query, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { STATUSES, CARRIERS } from '@/lib/types';
import { suggestOptimizedRoute, type SuggestOptimizedRouteOutput } from '@/ai/flows/suggest-optimized-route';
import { RouteStatusDialog } from './route-status-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const statusColors: Record<Status, string> = {
  Departed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
  Loading: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900/50 dark:text-fuchsia-300 dark:border-fuchsia-800',
  Waiting: 'bg-blue-900 text-white border-blue-950 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
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
    'Royal Mail': { className: 'bg-red-500 hover:bg-red-600 text-white border-red-600', icon: <Package className="h-4 w-4" /> },
    'EVRI': {
      className: 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600',
      icon: <Truck className="h-4 w-4 -scale-x-100" />
    },
    'The Very Group': {
      className: 'bg-black hover:bg-gray-800 text-white border-gray-800',
      iconUrl: 'https://marcommnews.com/wp-content/uploads/2020/05/1200px-Very-Group-Logo-2.svg_-1024x397.png',
      logoClassName: 'bg-white p-1 rounded-sm'
    },
    'Yodel': {
        className: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
        icon: <Truck className="h-4 w-4" />
    },
    'McBurney': {
        className: 'bg-[#f1a10d] hover:bg-[#d98e0b] text-white border-[#d98e0b]',
        icon: <Ship className="h-4 w-4" />
    },
    'Montgomery': {
        className: 'bg-[#A5350D] hover:bg-[#8A2C0A] text-white border-[#8A2C0A]',
        icon: <Route className="h-4 w-4" />
    },
};


export default function DepartureDashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeparture, setEditingDeparture] = useState<Departure | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDeparture, setDeletingDeparture] = useState<Departure | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isRouteStatusDialogOpen, setIsRouteStatusDialogOpen] = useState(false);
  const [selectedDepartureForStatus, setSelectedDepartureForStatus] = useState<Departure | null>(null);
  const [routeStatus, setRouteStatus] = useState<SuggestOptimizedRouteOutput | null>(null);
  const [isRouteStatusLoading, setIsRouteStatusLoading] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const firestore = useFirestore();

  const departuresQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'dispatchSchedules'), orderBy('collectionTime', 'asc'));
  }, [firestore]);

  const { data: departures, isLoading: isLoadingDepartures } = useCollection<Departure>(departuresQuery);


  useEffect(() => {
    if (!departures || isLoadingDepartures || !firestore) return;

    const interval = setInterval(() => {
      const now = new Date();
      departures.forEach(d => {
        if (d.status === 'Departed' || d.status === 'Cancelled' || d.status === 'Delayed') {
            return;
        }

        const collectionTime = new Date(d.collectionTime);
        let shouldBeDelayed = false;

        if (d.status === 'Loading' && now > collectionTime) {
            shouldBeDelayed = true;
        } else if (d.status === 'Waiting' && now > addMinutes(collectionTime, 10)) {
            shouldBeDelayed = true;
        }

        if (shouldBeDelayed) {
            const departureRef = doc(firestore, 'dispatchSchedules', d.id);
            setDocumentNonBlocking(departureRef, { status: 'Delayed' }, { merge: true });
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [departures, firestore, isLoadingDepartures]);

  const handleAddNew = () => {
    setEditingDeparture(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (departure: Departure) => {
    setEditingDeparture(departure);
    setIsDialogOpen(true);
  };

  const handleDelete = (departure: Departure) => {
    setDeletingDeparture(departure);
    setIsDeleteDialogOpen(true);
  };

  const handleShowRouteStatus = async (departure: Departure) => {
    setSelectedDepartureForStatus(departure);
    setIsRouteStatusDialogOpen(true);
    setIsRouteStatusLoading(true);
    setRouteStatus(null);
    try {
      const result = await suggestOptimizedRoute({
        currentLocation: "Sky Gate Derby DE74 2BB",
        destination: departure.destination,
        via: departure.via,
        trafficData: "Assume current conditions",
      });
      setRouteStatus(result);
    } catch (e: any) {
      console.error(e);
      let description = "Could not retrieve traffic warnings. Please try again.";
      if (e.message && e.message.includes('429')) {
        description = "Ați atins limita de cereri API. Vă rugăm să așteptați un minut înainte de a încerca din nou.";
      }
      toast({
        variant: "destructive",
        title: "Error Fetching Route Status",
        description: description,
      })
    } finally {
      setIsRouteStatusLoading(false);
    }
  };

  const confirmDelete = () => {
    if (deletingDeparture && firestore) {
      const departureRef = doc(firestore, 'dispatchSchedules', deletingDeparture.id);
      deleteDocumentNonBlocking(departureRef);
      toast({
        title: "Departure Deleted",
        description: `The departure for ${deletingDeparture.carrier} has been deleted.`,
      });
      setIsDeleteDialogOpen(false);
      setDeletingDeparture(null);
    }
  };

  const handleSave = (savedDeparture: Departure) => {
    if (!firestore) return;
    const { id, ...departureData } = savedDeparture;
    const isNew = !id;
    const departuresCol = collection(firestore, 'dispatchSchedules');
    
    if (isNew) {
        addDocumentNonBlocking(departuresCol, departureData);
        toast({
            title: "Departure Added",
            description: `A new departure for ${savedDeparture.carrier} has been added.`
        });
    } else {
        const originalDeparture = departures?.find(d => d.id === id);
        if (originalDeparture?.status !== 'Departed' && savedDeparture.status === 'Departed') {
            toast({
                title: "Truck Departed",
                description: `Trailer ${savedDeparture.trailerNumber} for ${savedDeparture.carrier} has departed.`,
            });
        }
        const departureRef = doc(firestore, 'dispatchSchedules', id);
        setDocumentNonBlocking(departureRef, departureData, { merge: true });
        toast({
            title: "Departure Updated",
            description: `The departure for ${savedDeparture.carrier} has been updated.`
        });
    }
  };

  const handleExport = () => {
    if (!departures) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "No data available to export.",
      });
      return;
    }
    const dataToExport = departures.map(d => ({
      'Carrier': d.carrier,
      'Via': d.via || 'N/A',
      'Destination': d.destination,
      'Trailer': d.trailerNumber,
      'Collection Time': format(parseISO(d.collectionTime), 'yyyy-MM-dd HH:mm'),
      'Bay': d.bayDoor || 'N/A',
      'Seal No.': d.sealNumber || 'N/A',
      'Driver': d.driverName || 'N/A',
      'Schedule No.': d.scheduleNumber,
      'Status': d.status,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Departures');
    
    worksheet['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
    ];
    
    XLSX.writeFile(workbook, `departures_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firestore) return;
    const departuresCol = collection(firestore, 'dispatchSchedules');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const newDepartures: Omit<Departure, 'id'>[] = json.map((row) => {
          const collectionTimeValue = row['Collection Time'];
          if (!collectionTimeValue) return null;
          
          let collectionTime;
          if (typeof collectionTimeValue === 'number') {
            const parsedDate = XLSX.SSF.parse_date_code(collectionTimeValue);
            collectionTime = new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d, parsedDate.H, parsedDate.M, parsedDate.S);
          } else {
             collectionTime = new Date(collectionTimeValue);
          }
          
          if (isNaN(collectionTime.getTime())) return null;

          return {
            carrier: row['Carrier'] as Carrier,
            destination: row['Destination'],
            via: row['Via'] === 'N/A' ? '' : row['Via'],
            trailerNumber: String(row['Trailer']),
            collectionTime: collectionTime.toISOString(),
            bayDoor: row['Bay'] === 'N/A' ? null : Number(row['Bay']),
            sealNumber: row['Seal No.'] === 'N/A' ? '' : String(row['Seal No.']),
            driverName: row['Driver'] === 'N/A' ? '' : String(row['Driver']),
            scheduleNumber: String(row['Schedule No.']),
            status: row['Status'] as Status,
          };
        }).filter((d): d is Omit<Departure, 'id'> => d !== null && d.carrier && d.destination && d.collectionTime && (CARRIERS as readonly string[]).includes(d.carrier));

        if (newDepartures.length > 0) {
            const batch = writeBatch(firestore);
            newDepartures.forEach(departure => {
                const docRef = doc(departuresCol); // Create a new doc with a generated id
                batch.set(docRef, departure);
            });
            await batch.commit();

            toast({
                title: "Import Successful",
                description: `${newDepartures.length} departures have been added from the Excel file.`,
            });
        } else {
             toast({
                variant: "destructive",
                title: "Import Failed",
                description: "No valid departures found in the file. Please check the file format and content.",
            });
        }
      } catch (error) {
        console.error("Error importing file:", error);
        toast({
            variant: "destructive",
            title: "Import Error",
            description: "There was an error processing your file. Please ensure it is a valid Excel file.",
        });
      }
    };
    reader.readAsBinaryString(file);
    
    if(event.target) event.target.value = '';
  };
  
  const handleClearAll = async () => {
    if (!firestore) return;
    const departuresCol = collection(firestore, 'dispatchSchedules');
    try {
        const querySnapshot = await getDocs(departuresCol);
        if (querySnapshot.empty) {
            toast({
                title: "Already Empty",
                description: "There is no data to clear."
            });
            setIsClearDialogOpen(false);
            return;
        }

        const batch = writeBatch(firestore);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        toast({
            title: "Clearance Complete",
            description: "All departure data has been deleted."
        });
    } catch (error) {
        console.error("Error clearing database:", error);
        toast({
            variant: "destructive",
            title: "Clearance Failed",
            description: "Could not clear all data from Firestore.",
        });
    }
    setIsClearDialogOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen">
        <Header 
          onImport={handleImportClick}
          onExport={handleExport}
          onAddNew={handleAddNew}
        />
        <main className="flex-1 flex flex-col space-y-4 p-4 md:p-8 pt-6 overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-2 md:gap-4">
              <CardTitle>Departures</CardTitle>
              <div className="bg-white p-1.5 rounded-md shadow-sm">
                  <div className="w-[60px] h-auto md:w-[100px]">
                      <Image src="https://marcommnews.com/wp-content/uploads/2020/05/1200px-Very-Group-Logo-2.svg_-1024x397.png" alt="The Very Group Logo" width={120} height={47} className="h-auto w-full" />
                  </div>
              </div>
              <Button size="sm" onClick={handleAddNew} className="ml-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="hidden md:inline">Add Departure</span>
                  <span className="md:hidden">Add</span>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls" className="hidden" />
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader className="bg-primary/90">
                    <TableRow className="border-primary/90 hover:bg-primary/90">
                      <TableHead className="text-primary-foreground">Carrier</TableHead>
                      <TableHead className="text-primary-foreground">Via</TableHead>
                      <TableHead className="text-primary-foreground">Destination</TableHead>
                      <TableHead className="text-primary-foreground">Trailer</TableHead>
                      <TableHead className="text-primary-foreground">Collection Time</TableHead>
                      <TableHead className="text-primary-foreground">Bay</TableHead>
                      <TableHead className="text-primary-foreground">Seal No.</TableHead>
                      <TableHead className="text-primary-foreground">Driver</TableHead>
                      <TableHead className="text-primary-foreground">Schedule No.</TableHead>
                      <TableHead className="text-primary-foreground">Status</TableHead>
                      <TableHead className="text-right text-primary-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingDepartures && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center h-24">
                            <div className="flex justify-center items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span>Loading departures...</span>
                            </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoadingDepartures && departures && departures.length > 0 ? (
                      departures.map(d => {
                        const carrierStyle = carrierStyles[d.carrier];
                        return (
                          <TableRow key={d.id} className={cn('transition-colors', statusColors[d.status])}>
                            <TableCell>
                              <Badge className={cn('flex items-center gap-2', carrierStyle?.className)}>
                                {carrierStyle.icon}
                                {carrierStyle?.iconUrl && (
                                  <div className={carrierStyle.logoClassName}>
                                    <Image src={carrierStyle.iconUrl} alt={`${d.carrier} logo`} width={16} height={16} className="h-auto w-4" />
                                  </div>
                                )}
                                <span>{d.carrier}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>{d.via || 'N/A'}</TableCell>
                            <TableCell className="font-medium">{d.destination}</TableCell>
                            <TableCell>{d.trailerNumber}</TableCell>
                            <TableCell>{format(parseISO(d.collectionTime), 'HH:mm')}</TableCell>
                            <TableCell>{d.bayDoor || 'N/A'}</TableCell>
                            <TableCell>{d.sealNumber || 'N/A'}</TableCell>
                            <TableCell>{d.driverName || 'N/A'}</TableCell>
                            <TableCell>{d.scheduleNumber}</TableCell>
                            <TableCell><Badge variant="outline" className="border-current">{d.status}</Badge></TableCell>
                            <TableCell className="text-right">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleShowRouteStatus(d)}>
                                    <TrafficCone className="h-4 w-4 text-orange-400" />
                                    <span className="sr-only">Route Status</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Verifică starea rutei</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Departure</p>
                                </TooltipContent>
                              </Tooltip>
                               <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(d)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Departure</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      !isLoadingDepartures && <TableRow>
                        <TableCell colSpan={11} className="text-center h-24">
                          No departures scheduled. Use "Add Departure" to create a new one.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
        <footer className="sticky bottom-0 border-t bg-background px-4 py-3 md:px-6 flex-shrink-0">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <span className="font-semibold text-base mr-2">Legend:</span>
              {STATUSES.map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full", statusColors[status])}></div>
                  <span>{status}</span>
                </div>
              ))}
              <div className="ml-auto mt-2 md:mt-0">
                <Button size="sm" variant="destructive" onClick={() => setIsClearDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </div>
        </footer>
        <EditDepartureDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          departure={editingDeparture}
          onSave={handleSave}
        />
        <RouteStatusDialog
          isOpen={isRouteStatusDialogOpen}
          onOpenChange={setIsRouteStatusDialogOpen}
          departure={selectedDepartureForStatus}
          routeStatus={routeStatus}
          isLoading={isRouteStatusLoading}
        />
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the departure
                for <span className="font-semibold">{deletingDeparture?.carrier}</span> with trailer <span className="font-semibold">{deletingDeparture?.trailerNumber}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all departure data from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">Yes, delete everything</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

    