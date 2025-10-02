"use client";

  import { auth } from '@/lib/firebase';
  import DashboardLayout from '@/components/DashboardLayout';
  import { collection, getDocs } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  import { useEffect, useState } from 'react';
  import { useParams, useRouter } from 'next/navigation';

  export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [shares, setShares] = useState([]);
    const [error, setError] = useState('');
    const params = useParams();
    const router = useRouter();

    useEffect(() => {
      let isMounted = true; // Flag to prevent state updates after unmount
      const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
        console.log('Auth state changed, user:', currentUser);
        if (!isMounted) return; // Prevent updates if unmounted

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

          console.log('Fetching data for company:', companyId);
          const [tasksSnapshot, jobsSnapshot, sharesSnapshot] = await Promise.all([
            getDocs(collection(db, `companies/${companyId}/tasks`)),
            getDocs(collection(db, `companies/${companyId}/jobs`)),
            getDocs(collection(db, `companies/${companyId}/shares`))
          ]);
          if (isMounted) {
            setTasks(tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setJobs(jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setShares(sharesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
          console.log('Fetched tasks:', tasks, 'jobs:', jobs, 'shares:', shares);
        } catch (err) {
          console.error('Error fetching data:', err);
          if (isMounted) setError(`Failed to load data: ${err.message}`);
        } finally {
          if (isMounted) setLoading(false);
        }
      });

      return () => {
        isMounted = false; // Cleanup on unmount
        unsubscribe();
      };
    }, [params, router]);

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>;
    if (error) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-500">{error}</div>;
    if (!user) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Redirecting...</div>;

    const { role, companyId } = params;

    return (
      <DashboardLayout role={role} companyId={companyId}>
        <h1 className="text-2xl mb-4 text-white">Vendor Dashboard - {companyId}</h1>
        <div className="p-4 bg-gray-800 rounded">
          <h2 className="text-xl mb-2 text-white">Assigned Tasks</h2>
          {tasks.length > 0 ? (
            <ul className="list-disc pl-5">
              {tasks.map(task => (
                <li key={task.id} className="mb-2 text-white">
                  {task.title || 'No title'} {task.description && `- ${task.description}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-2 text-white">No tasks yet. Check back for updates from your admin.</p>
          )}
        </div>
        <div className="p-4 bg-gray-800 rounded mt-4">
          <h2 className="text-xl mb-2 text-white">Assigned Jobs</h2>
          {jobs.length > 0 ? (
            <ul className="list-disc pl-5">
              {jobs.map(job => (
                <li key={job.id} className="mb-2 text-white">
                  {job.title || 'No title'} {job.description && `- ${job.description}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-2 text-white">No jobs yet.</p>
          )}
        </div>
        <div className="p-4 bg-gray-800 rounded mt-4">
          <h2 className="text-xl mb-2 text-white">Shared Files</h2>
          {shares.length > 0 ? (
            <ul className="list-disc pl-5">
              {shares.map(share => (
                <li key={share.id} className="mb-2 text-white">
                  {share.filePath || 'No file'} {share.createdAt && `- ${new Date(share.createdAt.seconds * 1000).toLocaleDateString()}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-2 text-white">No shared files yet.</p>
          )}
        </div>
      </DashboardLayout>
    );
  }