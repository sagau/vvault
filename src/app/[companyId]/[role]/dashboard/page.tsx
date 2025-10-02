"use client";

import { auth } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        console.error('No authenticated user, redirecting to login');
        router.push('/login');
        return;
      }

      setUser(currentUser);
      const { role, companyId } = params;
      try {
        const claims = (await currentUser.getIdTokenResult()).claims;
        console.log('Claims:', claims);
        if (claims.role !== role || claims.companyId !== companyId || role !== 'vendor') {
          console.error('Unauthorized access, redirecting to unauthorized', { claims, role, companyId });
          router.push('/unauthorized');
          return;
        }

        // Fetch tasks
        console.log('Fetching tasks for company:', companyId);
        const tasksSnapshot = await getDocs(collection(db, `companies/${companyId}/tasks`));
        const fetchedTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(fetchedTasks);
        console.log('Fetched tasks:', fetchedTasks);
      } catch (err) {
        console.error('Error checking claims or fetching tasks:', err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [params, router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-900">Loading dashboard...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-500">{error}</div>;
  if (!user) return <div className="flex items-center justify-center min-h-screen bg-gray-900">Redirecting...</div>;

  const { role, companyId } = params;

  return (
    <DashboardLayout role={role} companyId={companyId}>
      <h1 className="text-2xl mb-4">Vendor Dashboard - {companyId}</h1>
      <div className="p-4 bg-gray-800 rounded">
        <h2 className="text-xl mb-2">Assigned Tasks</h2>
        {tasks.length > 0 ? (
          <ul>
            {tasks.map(task => (
              <li key={task.id} className="mb-2">{task.title || 'No title'}</li>
            ))}
          </ul>
        ) : (
          <p className="mb-2">No tasks yet. Check back for updates from your admin.</p>
        )}
      </div>
    </DashboardLayout>
  );
}