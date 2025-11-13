'use client';

import { useEffect, useState } from 'react';
import { useAuth, useFirestore, useCollection } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where } from 'firebase/firestore';

interface Admin {
  id: string;
  email: string;
}

export const useUser = () => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        setIsLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (userState) => {
      setUser(userState);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const adminsCollection = firestore ? collection(firestore, 'admins') : null;
  const adminQuery = user && adminsCollection ? query(adminsCollection, where('email', '==', user.email)) : null;
  const { data: adminData, isLoading: isCheckingAdmin } = useCollection<Admin>(adminQuery);

  useEffect(() => {
    if (isLoading || isCheckingAdmin) {
      setIsAdminLoading(true);
      return;
    }
    if (!user) {
      setIsAdmin(false);
      setIsAdminLoading(false);
      return;
    }
    setIsAdmin(adminData ? adminData.length > 0 : false);
    setIsAdminLoading(false);
  }, [user, adminData, isLoading, isCheckingAdmin]);

  return { user, isLoading, isAdmin, isAdminLoading };
};
