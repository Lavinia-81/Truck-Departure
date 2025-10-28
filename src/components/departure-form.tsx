"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Departure, CARRIERS, STATUSES } from "@/lib/types"
import { format, parseISO } from "date-fns"

const formSchema = z.object({
  carrier: z.enum(CARRIERS),
  via: z.string().optional(),
  destination: z.string().min(2, "Destination is required."),
  trailerNumber: z.string().min(1, "Trailer number is required."),
  collectionTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  bayDoor: z.coerce.number().int().min(1, "Bay door is required."),
  sealNumber: z.string().optional(),
  scheduleNumber: z.string().min(1, "Schedule number is required."),
  status: z.enum(STATUSES),
});

type DepartureFormValues = z.infer<typeof formSchema>;

interface DepartureFormProps {
  departure: Departure | null
  onSave: (departure: Departure) => void
  onCancel: () => void
}

export function DepartureForm({ departure, onSave, onCancel }: DepartureFormProps) {
  const defaultValues: Partial<DepartureFormValues> = departure
    ? {
        ...departure,
        collectionTime: format(parseISO(departure.collectionTime), "yyyy-MM-dd'T'HH:mm"),
      }
    : {
        status: 'Waiting',
        collectionTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      };
  
  const form = useForm<DepartureFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  function onSubmit(data: DepartureFormValues) {
    const newDeparture: Departure = {
      id: departure?.id || '', // ID will be handled by parent component (Firestore)
      ...data,
      collectionTime: new Date(data.collectionTime).toISOString(),
    };
    onSave(newDeparture);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="carrier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carrier</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a carrier" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CARRIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="via" render={({ field }) => (<FormItem><FormLabel>Via (First Stop)</FormLabel><FormControl><Input placeholder="e.g., Birmingham (optional)" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="destination" render={({ field }) => (<FormItem><FormLabel>Final Destination</FormLabel><FormControl><Input placeholder="e.g., London" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="trailerNumber" render={({ field }) => (<FormItem><FormLabel>Trailer Number</FormLabel><FormControl><Input placeholder="e.g., TR-12345" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="scheduleNumber" render={({ field }) => (<FormItem><FormLabel>Schedule Number</FormLabel><FormControl><Input placeholder="e.g., SCH-001" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="collectionTime" render={({ field }) => (<FormItem><FormLabel>Collection Time</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="bayDoor" render={({ field }) => (<FormItem><FormLabel>Bay Door</FormLabel><FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="sealNumber" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Seal Number</FormLabel><FormControl><Input placeholder="e.g., S-RM123 (optional)" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  )
}
