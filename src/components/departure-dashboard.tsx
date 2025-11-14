"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Edit, Trash2, TrafficCone, PlusCircle, Ship, Route, LogIn, LogOut } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Departure, Status } from '@/lib/types';
import { EditDepartureDialog } from './edit-departure-dialog';
import { useToast } from '@/components/ui/use-toast';
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
import { Loader2, Package, Truck } from 'lucide-react';
import { STATUSES } from '@/lib/types';
import { suggestOptimizedRoute, type SuggestOptimizedRouteOutput } from '@/ai/flows/suggest-optimized-route';
import { RouteStatusDialog } from './route-status-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCollection, useFirestore, useAuth, useUser } from '@/firebase';
import { collection, doc, addDoc, setDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { ThemeToggle } from './theme-toggle';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


const statusColors: Record<Status, string> = {
  Departed: 'bg-green-200 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
  Loading: 'bg-fuchsia-200 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-900/50 dark:text-fuchsia-300 dark:border-fuchsia-800',
  Waiting: 'bg-blue-200 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
  Cancelled: 'bg-red-200 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
  Delayed: 'bg-pink-200 text-pink-800 border-pink-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800',
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

function LoginScreen() {
    const auth = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const { toast } = useToast();

    const handleLogin = async () => {
        setIsSigningIn(true);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error: any) {
            console.error("Login failed:", error);
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: error.message || 'An unexpected error occurred during login.',
            });
        } finally {
            setIsSigningIn(false);
        }
    };

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Card className="max-w-md p-8 text-center">
                 <CardHeader>
                    <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
                     <div className="flex justify-center pt-4">
                        <div className="bg-white p-2 rounded-md shadow-sm">
                            <div className="w-[120px] h-auto">
                                <Image src="https://marcommnews.com/wp-content/uploads/2020/05/1200px-Very-Group-Logo-2.svg_-1024x397.png" alt="The Very Group Logo" width={150} height={58} className="h-auto w-full" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="mb-6 text-muted-foreground">Please log in to manage truck departures.</p>
                    <Button onClick={handleLogin} disabled={isSigningIn}>
                        {isSigningIn ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <LogIn className="mr-2 h-4 w-4" />
                        )}
                        Login with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}


export default function DepartureDashboard() {
  const auth = useAuth();
  const { user, isLoading: isLoadingUser } = useUser();
  const firestore = useFirestore();
  
  // Conditionally set the collection path only if the user is logged in
  const departuresCollection = firestore && user ? collection(firestore, 'dispatchSchedules') : null;
  const { data: departures, isLoading: isLoadingDepartures } = useCollection<Departure>(departuresCollection);

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
      if (e.message?.includes('429')) {
        description = "You have reached the API request limit. Please wait one minute before trying again.";
      } else if (e.message?.toLowerCase().includes('api key') || e.message?.toLowerCase().includes('permission')) {
        description = "The API key for the AI service is not valid or not configured. Check the .env.local file.";
      } else if (e.message?.includes('NOT_FOUND')) {
        description = "The AI model was not found. This might be a configuration issue. Please contact support."
      }
      toast({
        variant: "destructive",
        title: "Error Fetching Route Status",
        description: description,
      });
      setIsRouteStatusDialogOpen(false); 
    } finally {
      setIsRouteStatusLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingDeparture || !deletingDeparture.id || !firestore) {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Invalid departure selected for deletion.",
        });
        setIsDeleteDialogOpen(false);
        setDeletingDeparture(null);
        return;
    }

    try {
        const docRef = doc(firestore, 'dispatchSchedules', deletingDeparture.id);
        await deleteDoc(docRef);
        toast({
            title: "Departure Deleted",
            description: `The departure for ${deletingDeparture.carrier} has been deleted.`,
        });
    } catch (error) {
        console.error("Error deleting departure: ", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete the departure from the database.",
        });
    } finally {
        setIsDeleteDialogOpen(false);
        setDeletingDeparture(null);
    }
  };

  const handleSave = async (savedDeparture: Omit<Departure, 'id'> & { id?: string }) => {
    if (!firestore) return;

    const isNew = !savedDeparture.id;
    
    try {
      if (isNew) {
          const collectionRef = collection(firestore, 'dispatchSchedules');
          await addDoc(collectionRef, savedDeparture);
          toast({
              title: "Departure Added",
              description: `A new departure for ${savedDeparture.carrier} has been added.`
          });
      } else {
          const docRef = doc(firestore, 'dispatchSchedules', savedDeparture.id);
          const originalDeparture = departures?.find(d => d.id === savedDeparture.id);
          
          await setDoc(docRef, savedDeparture);

          if (originalDeparture?.status !== 'Departed' && savedDeparture.status === 'Departed') {
              toast({
                  title: "Truck Departed",
                  description: `Trailer ${savedDeparture.trailerNumber} for ${savedDeparture.carrier} has departed.`,
              });
          } else if (originalDeparture?.status !== savedDeparture.status) {
            toast({
                title: "Status Updated",
                description: `Departure for ${savedDeparture.carrier} is now ${savedDeparture.status}.`
            });
          } else {
            toast({
                title: "Departure Updated",
                description: `The departure for ${savedDeparture.carrier} has been updated.`
            });
          }
      }
    } catch (error) {
       console.error("Error saving departure:", error);
       toast({
         variant: "destructive",
         title: "Save Failed",
         description: "Could not save the departure to the database.",
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
      'Trailer': d.trailerNumber || 'N/A',
      'Collection Time': format(parseISO(d.collectionTime), 'yyyy-MM-dd HH:mm'),
      'Bay': d.bayDoor || 'N/A',
      'Seal No.': d.sealNumber || 'N/A',
      'Driver': d.driverName || 'N/A',
      'Schedule No.': d.scheduleNumber || 'N/A',
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
    if (!firestore) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const newDepartures: Omit<Departure, 'id'>[] = json.map((row): Omit<Departure, 'id'> | null => {
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
          
          const getTrimmedString = (value: any): string => {
            if (value === null || typeof value === 'undefined') {
              return '';
            }
            return String(value).trim();
          };
          
          const carrier = getTrimmedString(row['Carrier']);
          const destination = getTrimmedString(row['Destination']);
          const trailerNumber = getTrimmedString(row['Trailer']);
          const scheduleNumber = getTrimmedString(row['Schedule No.']);

          if (!carrier || !destination || !trailerNumber || !scheduleNumber) {
            console.warn('Skipping row due to missing required fields:', row);
            return null;
          }

          return {
            carrier: carrier as Departure['carrier'],
            destination: destination,
            via: (row['Via'] === 'N/A' || !row['Via']) ? '' : getTrimmedString(row['Via']),
            trailerNumber: trailerNumber,
            collectionTime: collectionTime.toISOString(),
            bayDoor: (row['Bay'] && row['Bay'] !== 'N/A') ? Number(row['Bay']) : null,
            sealNumber: (row['Seal No.'] === 'N/A' || !row['Seal No.']) ? '' : getTrimmedString(row['Seal No.']),
            driverName: (row['Driver'] === 'N/A' || !row['Driver']) ? '' : getTrimmedString(row['Driver']),
            scheduleNumber: scheduleNumber,
            status: (getTrimmedString(row['Status']) as Status) || 'Waiting',
          };
        }).filter((d): d is Omit<Departure, 'id'> => d !== null);

        if (newDepartures.length > 0) {
            const batch = writeBatch(firestore);
            const collectionRef = collection(firestore, 'dispatchSchedules');
            newDepartures.forEach(dep => {
              const docRef = doc(collectionRef); // Automatically generate new ID
              batch.set(docRef, dep);
            });
            await batch.commit();

            toast({
                title: "Import Successful",
                description: `${newDepartures.length} departures have been added to Firestore.`,
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
    if (!departures || departures.length === 0) {
        toast({
            title: "Already Empty",
            description: "There is no data to clear."
        });
        setIsClearDialogOpen(false);
        return;
    }
    
    try {
        const collectionRef = collection(firestore, 'dispatchSchedules');
        const querySnapshot = await getDocs(collectionRef);
        const batch = writeBatch(firestore);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        toast({
            title: "Clearance Complete",
            description: "All departure data has been deleted from Firestore."
        });
    } catch (error) {
        console.error("Error clearing all data:", error);
        toast({
            variant: "destructive",
            title: "Clearance Failed",
            description: "Could not delete all departure data. Please try again."
        });
    }
    
    setIsClearDialogOpen(false);
  };
  
  const handleLogout = async () => {
    await signOut(auth);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };


  const sortedDepartures = departures ? [...departures].sort((a, b) => new Date(a.collectionTime).getTime() - new Date(b.collectionTime).getTime()) : [];

  if (isLoadingUser) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Checking authentication...</p>
        </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }


  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen">
        <Header 
          onImport={handleImportClick}
          onExport={handleExport}
        />
        <main className="flex-1 flex flex-col space-y-4 p-4 md:p-8 pt-6 overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden bg-card">
            <CardHeader className="flex flex-row items-center justify-between gap-2 md:gap-4">
               <div className="flex items-center gap-4">
                <CardTitle>Departures</CardTitle>
                <div className="bg-white p-1.5 rounded-md shadow-sm">
                    <div className="w-[60px] h-auto md:w-[100px]">
                        <Image src="https://marcommnews.com/wp-content/uploads/2020/05/1200px-Very-Group-Logo-2.svg_-1024x397.png" alt="The Very Group Logo" width={120} height={47} className="h-auto w-full" />
                    </div>
                </div>
              </div>
              <div className="ml-auto">
                  <Button onClick={handleAddNew}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Departure
                  </Button>
              </div>
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
                    {isLoadingDepartures ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center h-24">
                            <div className="flex justify-center items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span>Loading departures from Firestore...</span>
                            </div>
                        </TableCell>
                      </TableRow>
                    ) : sortedDepartures.length > 0 ? (
                      sortedDepartures.map(d => {
                        const carrierStyle = carrierStyles[d.carrier] || {};
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
                                  <Button variant="ghost" size="icon" onClick={() => handleShowRouteStatus(d)} disabled={d.status === 'Departed'}>
                                    <TrafficCone className="h-4 w-4 text-orange-400" />
                                    <span className="sr-only">Route Status</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Check Route Status</p>
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
                       <TableRow>
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
        <footer className="sticky bottom-0 border-t bg-card px-4 py-3 md:px-6 flex-shrink-0">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <span className="font-semibold text-base mr-2">Legend:</span>
              {STATUSES.map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full", statusColors[status])}></div>
                  <span>{status}</span>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-4 mt-2 md:mt-0">
                  {user && (
                    <div className="flex items-center gap-2">
                       <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  )}
                <ThemeToggle />
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
