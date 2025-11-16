'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Trash2, UserPlus, Users } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AuthGuard } from '@/components/auth-guard';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

interface Admin {
  id: string;
  email: string;
}

function AdminManager() {
  const firestore = useFirestore();
  const { data: admins, isLoading, error } = useCollection<Omit<Admin, 'id'>>(firestore ? collection(firestore, 'admins') : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
        const adminsRef = collection(firestore, 'admins');
        const q = query(adminsRef, where('email', '==', values.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            toast({
                variant: 'destructive',
                title: 'Administrator Already Exists',
                description: `The email ${values.email} is already registered as an administrator.`,
            });
            setIsSubmitting(false);
            return;
        }

      await addDoc(adminsRef, { email: values.email });
      toast({
        title: 'Administrator Added',
        description: `${values.email} can now access the admin panel.`,
      });
      form.reset();
    } catch (e) {
      console.error('Error adding administrator: ', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not add the administrator. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (adminId: string) => {
    if (!firestore) return;

    try {
      await deleteDoc(doc(firestore, 'admins', adminId));
      toast({
        title: 'Administrator Removed',
        description: 'The user has been removed from the administrators list.',
      });
    } catch (e) {
      console.error('Error deleting administrator: ', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not remove the administrator. Please try again.',
      });
    }
  };
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Admin Management</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Add New Administrator</CardTitle>
                    <CardDescription>Enter the email of the user you want to grant admin access to.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="admin@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                Add Administrator
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Current Administrators</CardTitle>
                    <CardDescription>List of users with access to the admin panel.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <p className="text-destructive">Failed to load administrators.</p>
                    ): admins && admins.length > 0 ? (
                         <ul className="space-y-2">
                            {admins.map((admin) => (
                                <li key={admin.id} className="flex items-center justify-between rounded-md border p-3">
                                    <span className="font-medium">{admin.email}</span>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently remove <span className="font-bold">{admin.email}</span> from the list of administrators.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(admin.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Remove
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="text-center text-muted-foreground py-8">
                            <Users className="mx-auto h-12 w-12" />
                            <p className="mt-4">No administrators found.</p>
                         </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

export default function AdminsPage() {
    return (
        <AuthGuard>
            <AdminManager />
        </AuthGuard>
    )
}
