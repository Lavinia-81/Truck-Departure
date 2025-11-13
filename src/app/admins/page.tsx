'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mail, PlusCircle, Trash2, UserX } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Adresa de e-mail nu este validă.'),
});

type AdminFormValues = z.infer<typeof formSchema>;
type Admin = { id: string; email: string };

export default function AdminsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const adminsCollection = firestore ? collection(firestore, 'admins') : null;
  const { data: admins, isLoading } = useCollection<Admin>(adminsCollection);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: AdminFormValues) {
    if (!adminsCollection || !firestore) return;

    setIsSubmitting(true);

    try {
       // Check if email already exists
      const q = query(adminsCollection, where("email", "==", data.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Eroare',
          description: 'Această adresă de e-mail a fost deja adăugată.',
        });
        setIsSubmitting(false);
        return;
      }

      await addDoc(adminsCollection, { email: data.email });
      toast({
        title: 'Succes',
        description: `Adresa de e-mail ${data.email} a fost adăugată.`,
      });
      form.reset();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast({
        variant: 'destructive',
        title: 'Eroare la adăugare',
        description: 'Nu s-a putut adăuga adresa de e-mail. Vă rugăm să încercați din nou.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(adminId: string) {
    if (!adminsCollection || !firestore) return;

    try {
      await deleteDoc(doc(firestore, 'admins', adminId));
      toast({
        title: 'Succes',
        description: 'Adresa de e-mail a fost ștearsă.',
      });
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        variant: 'destructive',
        title: 'Eroare la ștergere',
        description: 'Nu s-a putut șterge adresa de e-mail. Vă rugăm să încercați din nou.',
      });
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Gestionare administratori</CardTitle>
          <CardDescription>
            Adăugați sau ștergeți adresele de e-mail ale utilizatorilor care pot accesa panoul de administrare.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4 mb-8">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel className="sr-only">E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="exemplu@domeniu.com" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                <span className="hidden md:inline ml-2">Adaugă</span>
              </Button>
            </form>
          </Form>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Listă administratori</h3>
            {isLoading && (
              <div className="flex items-center justify-center text-muted-foreground py-8">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <p>Se încarcă lista...</p>
              </div>
            )}
            {!isLoading && admins && admins.length > 0 ? (
              <ul className="divide-y divide-border rounded-md border">
                {admins.map(admin => (
                  <li key={admin.id} className="flex items-center justify-between p-3">
                    <span className="text-sm text-foreground">{admin.email}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(admin.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Șterge</span>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
                !isLoading && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8 border rounded-md">
                        <UserX className="h-10 w-10 mb-4" />
                        <p className="font-medium">Niciun administrator adăugat</p>
                        <p className="text-sm">Folosiți formularul de mai sus pentru a adăuga primul administrator.</p>
                    </div>
                )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
