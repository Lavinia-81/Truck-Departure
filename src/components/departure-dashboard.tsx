"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Edit, Truck, Package, Anchor, Building, Trash2, PlusCircle, Database, LogOut } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Departure, Status, Carrier, CARRIERS } from '@/lib/types';
import { initialDepartures } from '@/lib/data';
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
import { DashboardActions } from './dashboard-actions';
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, writeBatch, getDoc, type IdTokenResult } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';

const statusColors: Record<Status, string> = {
  Departed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
  Loading: 'bg-yellow-300 text-yellow-900 border-yellow-400 dark:bg-yellow-800/50 dark:text-yellow-200 dark:border-yellow-700',
  Waiting: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
  Cancelled: 'bg-red-500 text-red-900 border-red-600 dark:bg-red-800/50 dark:text-red-200 dark:border-red-700',
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

function useAdminRole() {
  const { user, isUserLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    user.getIdTokenResult(true) // Force refresh the token to get latest claims
      .then((idTokenResult: IdTokenResult) => {
        const claims = idTokenResult.claims;
        setIsAdmin(claims.role === 'admin');
        setIsLoading(false);
      })
      .catch(() => {
        setIsAdmin(false);
        setIsLoading(false);
      });
  }, [user, isUserLoading]);

  return { isAdmin, isLoading: isLoading };
}

export default function DepartureDashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeparture, setEditingDeparture] = useState<Departure | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDeparture, setDeletingDeparture] = useState<Departure | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const firestore = useFirestore();
  const { user, isUserLoading, auth } = useUser(true);
  const {isAdmin, isLoading: isAdminLoading} = useAdminRole();
  const router = useRouter();

  const departuresCol = useMemoFirebase(() => collection(firestore, 'dispatchSchedules'), [firestore]);
  const { data: departures, isLoading: isLoadingDepartures } = useCollection<Departure>(departuresCol);

  useEffect(() => {
      if (!isUserLoading && !user) {
          router.push('/login');
      }
  }, [user, isUserLoading, router])


  useEffect(() => {
    if (!departures || isLoadingDepartures) return;

    const interval = setInterval(() => {
      departures.forEach(d => {
        if (d.status === 'Waiting' && new Date() > new Date(d.collectionTime)) {
            const departureRef = doc(firestore, 'dispatchSchedules', d.id);
            updateDocumentNonBlocking(departureRef, { status: 'Delayed' });
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

  const confirmDelete = () => {
    if (deletingDeparture) {
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
    const { id, ...departureData } = savedDeparture;
    const isNew = !id;
    
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
      'Bay': d.bayDoor,
      'Seal No.': d.sealNumber || 'N/A',
      'Schedule No.': d.scheduleNumber,
      'Status': d.status,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Departures');
    
    worksheet['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
    ];
    
    XLSX.writeFile(workbook, `departures_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
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
            bayDoor: Number(row['Bay']),
            sealNumber: row['Seal No.'] === 'N/A' ? '' : String(row['Seal No.']),
            scheduleNumber: String(row['Schedule No.']),
            status: row['Status'] as Status,
          };
        }).filter((d): d is Omit<Departure, 'id'> => d !== null && d.carrier && d.destination && d.collectionTime && CARRIERS.includes(d.carrier));

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
  
  const sortedDepartures = useMemo(() => {
      if (!departures) return [];
      return [...departures].sort((a, b) => {
        const aTime = new Date(a.collectionTime).getTime();
        const bTime = new Date(b.collectionTime).getTime();
        return aTime - bTime;
      });
  }, [departures])

  const seedDatabase = async () => {
    try {
        const batch = writeBatch(firestore);
        initialDepartures.forEach(departure => {
            const {id, ...departureData} = departure;
            const docRef = doc(firestore, 'dispatchSchedules', id);
            batch.set(docRef, departureData);
        });
        await batch.commit();
        toast({
            title: "Database Seeded",
            description: "Initial departure data has been loaded into Firestore."
        });
    } catch (error) {
        console.error("Error seeding database:", error);
        toast({
            variant: "destructive",
            title: "Seeding Failed",
            description: "Could not load initial data into Firestore.",
        });
    }
  };

  const handleLogout = async () => {
      await signOut(auth);
      router.push('/login');
  }

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  const headerActions = (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <>
          <DashboardActions 
              onExport={handleExport}
              onImportClick={handleImportClick}
          />
          <Button size="sm" variant="outline" onClick={seedDatabase}>
              <Database className="mr-2 h-4 w-4" />
              Seed
          </Button>
        </>
      )}
      {user && (
          <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground hidden sm:inline'>{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className='mr-2 h-4 w-4'/>
                  Logout
              </Button>
          </div>
      )}
    </div>
  );


  return (
    <>
    <Header actions={headerActions} />
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Departures</CardTitle>
            {isAdmin && (
                <Button size="sm" onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Departure
                </Button>
            )}
        </CardHeader>
        <CardContent>
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
                    <TableHead className="text-primary-foreground">Schedule No.</TableHead>
                    <TableHead className="text-primary-foreground">Status</TableHead>
                    <TableHead className="text-right text-primary-foreground">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {(isLoadingDepartures || isAdminLoading) && (
                    <TableRow>
                        <TableCell colSpan={10} className="text-center h-24">Loading departures...</TableCell>
                    </TableRow>
                )}
                {!(isLoadingDepartures || isAdminLoading) && sortedDepartures.length > 0 ? (
                    sortedDepartures.map(d => {
                    const carrierStyle = carrierStyles[d.carrier];
                    const IconComponent = carrierStyle.icon;
                    return (
                        <TableRow key={d.id} className={cn('transition-colors', statusColors[d.status])}>
                        <TableCell>
                            <Badge className={cn('flex items-center gap-2', carrierStyle.className)}>
                            {IconComponent && <IconComponent className="h-4 w-4" />}
                            {carrierStyle.iconUrl && <Image src={carrierStyle.iconUrl} alt={`${d.carrier} logo`} width={16} height={16} className="rounded-sm" />}
                            <span>{d.carrier}</span>
                            </Badge>
                        </TableCell>
                        <TableCell>{d.via || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{d.destination}</TableCell>
                        <TableCell>{d.trailerNumber}</TableCell>
                        <TableCell>{format(parseISO(d.collectionTime), 'HH:mm')}</TableCell>
                        <TableCell>{d.bayDoor}</TableCell>
                        <TableCell>{d.sealNumber || 'N/A'}</TableCell>
                        <TableCell>{d.scheduleNumber}</TableCell>
                        <TableCell><Badge variant="outline" className="border-current">{d.status}</Badge></TableCell>
                        <TableCell className="text-right">
                            {isAdmin ? (
                                <>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(d)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </>
                            ) : (
                                <span className="text-xs text-muted-foreground">View Only</span>
                            )}
                        </TableCell>
                        </TableRow>
                    );
                    })
                ) : (
                    !(isLoadingDepartures || isAdminLoading) && <TableRow>
                    <TableCell colSpan={10} className="text-center">
                        No departures scheduled.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </div>
        </CardContent>
        </Card>
    </div>
      {isAdmin && <EditDepartureDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        departure={editingDeparture}
        onSave={handleSave}
      />}
      {isAdmin && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
      </AlertDialog>}
    </>
  );
}
