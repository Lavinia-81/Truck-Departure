"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DepartureForm } from "./departure-form"
import type { Departure } from "@/lib/types"

interface EditDepartureDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  departure: Departure | null
  onSave: (departure: Omit<Departure, 'id'> & { id?: string }) => void
}

export function EditDepartureDialog({ isOpen, onOpenChange, departure, onSave }: EditDepartureDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{departure ? 'Edit Departure' : 'Add New Departure'}</DialogTitle>
          <DialogDescription>
            {departure ? 'Update the details for this departure.' : 'Fill in the details for the new departure.'}
          </DialogDescription>
        </DialogHeader>
        <DepartureForm
          departure={departure}
          onSave={(savedDeparture) => {
            onSave(savedDeparture)
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
