"use client";

import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, Edit, Truck, Package, Ship, Anchor } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Departure, Status, Carrier } from '@/lib/types';
import { initialDepartures } from '@/lib/data';
import { EditDepartureDialog } from './edit-departure-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusColors: Record<Status, string> = {
  Departed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
  Loading: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
  Waiting: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
  Cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
  Delayed: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800',
};

const carrierStyles: Record<Carrier, { className: string; icon: React.ComponentType<{ className?: string }> }> = {
    'Royal Mail': { className: 'bg-red-500 hover:bg-red-600 text-white border-red-600', icon: Package },
    'EVRI': { className: 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600', icon: Truck },
    'Yodel': { className: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700', icon: Ship },
    'McBurney': { className: 'bg-purple-500 hover:bg-purple-600 text-white border-purple-600', icon: Anchor },
};

export default function DepartureDashboard() {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeparture, setEditingDeparture] = useState<Departure | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Sort initial data by collection time
    const sortedInitial = [...initialDepartures].sort((a, b) => new Date(a.collectionTime).getTime() - new Date(b.collectionTime).getTime());
    setDepartures(sortedInitial);

    const interval = setInterval(() => {
      setDepartures(prevDepartures =>
        prevDepartures.map(d => {
          if (d.status === 'Waiting' && new Date() > new Date(d.collectionTime)) {
            return { ...d, status: 'Delayed' };
          }
          return d;
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleAddNew = () => {
    setEditingDeparture(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (departure: Departure) => {
    setEditingDeparture(departure);
    setIsDialogOpen(true);
  };

  const handleSave = (savedDeparture: Departure) => {
    const isNew = !departures.some(d => d.id === savedDeparture.id);
    let updatedDepartures;

    if (isNew) {
      updatedDepartures = [...departures, savedDeparture];
    } else {
      const originalDeparture = departures.find(d => d.id === savedDeparture.id);
      if (originalDeparture?.status !== 'Departed' && savedDeparture.status === 'Departed') {
        toast({
          title: "Truck Departed",
          description: `Trailer ${savedDeparture.trailerNumber} for ${savedDeparture.carrier} has departed.`,
        });
      }
      updatedDepartures = departures.map(d => (d.id === savedDeparture.id ? savedDeparture : d));
    }
    
    // Re-sort after adding/editing
    updatedDepartures.sort((a, b) => new Date(a.collectionTime).getTime() - new Date(b.collectionTime).getTime());
    setDepartures(updatedDepartures);
  };
  
  const sortedDepartures = useMemo(() => {
      return [...departures].sort((a, b) => {
        const aTime = new Date(a.collectionTime).getTime();
        const bTime = new Date(b.collectionTime).getTime();
        return aTime - bTime;
      });
  }, [departures])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Departures</CardTitle>
        <Button size="sm" onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Departure
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Carrier</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Via</TableHead>
                <TableHead>Trailer</TableHead>
                <TableHead>Collection Time</TableHead>
                <TableHead>Bay</TableHead>
                <TableHead>Seal No.</TableHead>
                <TableHead>Schedule No.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDepartures.length > 0 ? (
                sortedDepartures.map(d => {
                  const carrierStyle = carrierStyles[d.carrier];
                  const Icon = carrierStyle.icon;
                  return (
                    <TableRow key={d.id} className={cn('transition-colors', statusColors[d.status])}>
                      <TableCell>
                        <Badge className={cn('flex items-center gap-2', carrierStyle.className)}>
                          <Icon className="h-4 w-4" />
                          <span>{d.carrier}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{d.destination}</TableCell>
                      <TableCell>{d.via || 'N/A'}</TableCell>
                      <TableCell>{d.trailerNumber}</TableCell>
                      <TableCell>{format(parseISO(d.collectionTime), 'HH:mm')}</TableCell>
                      <TableCell>{d.bayDoor}</TableCell>
                      <TableCell>{d.sealNumber || 'N/A'}</TableCell>
                      <TableCell>{d.scheduleNumber}</TableCell>
                      <TableCell><Badge variant="outline" className="border-current">{d.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    No departures scheduled.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <EditDepartureDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        departure={editingDeparture}
        onSave={handleSave}
      />
    </Card>
  );
}
