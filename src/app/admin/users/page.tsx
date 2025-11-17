"use client";

import { useState } from 'react';
import { useAuth } from '@/firebase/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useCollection } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, UserPlus, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Admin {
  id: string; // email in this case
}

export default function UserManagementPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const adminsQuery = firestore ? collection(firestore, 'admins') : null;
  const { data: admins, isLoading: isLoadingAdmins } = useCollection<Admin>(adminsQuery);

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!isAdmin) {
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <div className="text-center p-8 border rounded-lg">
                <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                <p className="text-muted-foreground mt-2">You do not have permission to access this page.</p>
            </div>
        </div>
    )
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !newAdminEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
        toast({
            variant: "destructive",
            title: "Invalid Email",
            description: "Please enter a valid email address.",
        });
        return;
    }
    
    if (admins?.some(admin => admin.id.toLowerCase() === newAdminEmail.toLowerCase())) {
         toast({
            variant: "destructive",
            title: "Administrator Exists",
            description: "This user already has admin privileges.",
        });
        return;
    }


    setIsSubmitting(true);
    try {
      const adminDocRef = doc(firestore, 'admins', newAdminEmail.toLowerCase());
      // We don't need to store any data in the doc, the email ID is enough
      await setDoc(adminDocRef, {}); 
      toast({
        title: 'Administrator Added',
        description: `${newAdminEmail} now has admin privileges.`,
      });
      setNewAdminEmail('');
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add administrator.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!firestore) return;

    if (user?.email?.toLowerCase() === adminId.toLowerCase()) {
        toast({
            variant: "destructive",
            title: "Action Not Allowed",
            description: "You cannot remove your own admin privileges.",
        });
        return;
    }

    try {
      await deleteDoc(doc(firestore, 'admins', adminId));
      toast({
        title: 'Administrator Removed',
        description: `${adminId} no longer has admin privileges.`,
      });
    } catch (error) {
      console.error("Error removing admin:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove administrator.',
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
        <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Add or remove users with administrator privileges.</p>
        </header>

      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Add New Administrator</CardTitle>
          <CardDescription>Enter the email address of the user you want to grant admin access to.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAdmin} className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              disabled={isSubmitting}
              className="text-base md:text-sm"
            />
            <Button type="submit" disabled={isSubmitting || !newAdminEmail}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Add Admin
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8 max-w-4xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Current Administrators</CardTitle>
           <CardDescription>This is a list of all users with administrator privileges.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAdmins ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : admins && admins.length > 0 ? (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {admin.id}
                        {user?.email?.toLowerCase() === admin.id.toLowerCase() && (
                            <ShieldCheck className="h-5 w-5 text-sky-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                disabled={user?.email?.toLowerCase() === admin.id.toLowerCase()}
                                >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently revoke admin access for <span className='font-bold'>{admin.id}</span>. They will no longer be able to manage departures.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleDeleteAdmin(admin.id)}
                              >
                                Remove Access
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      No administrators found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
