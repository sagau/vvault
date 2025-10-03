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
      let isMounted = true;
      let authRetry = 0;
      const maxRetries = 2;

      const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
        console.log('Auth state changed, user:', currentUser);
        if (!isMounted) return;

        if (!currentUser) {
          console.warn('No authenticated user detected, retrying...', authRetry);
          if (authRetry < maxRetries) {
            authRetry++;
            setTimeout(() => {}, 1000);
            return;
          }
          console.error('Max retries reached, redirecting to login');
          router.push('/login');
          return;
        }

        authRetry = 0;
        setUser(currentUser);
        const { role, companyId } = params;
        try {
          const claims = (await currentUser.getIdTokenResult()).claims;
          console.log('Claims:', claims);
          if (claims.role !== role || claims.companyId !== companyId || role !== 'vendor') {
            console.error('Unauthorized access, redirecting', { claims, role, companyId });
            router.push('/unauthorized');
            return;
          }

          console.log('Fetching data for company:', companyId);
          const [tasksSnapshot, jobsSnapshot, sharesSnapshot] = await Promise.all([
            getDocs(collection(db, `companies/${companyId}/tasks`)),
            getDocs(collection(db, `companies/${companyId}/jobs`)),
            getDocs(collection(db, `companies/${companyId}/shares`))
          ]);
          const fetchedTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const fetchedJobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const fetchedShares = sharesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (isMounted) {
            setTasks(fetchedTasks);
            setJobs(fetchedJobs);
            setShares(fetchedShares);
          }
          console.log('Fetched tasks:', fetchedTasks, 'jobs:', fetchedJobs, 'shares:', fetchedShares);
        } catch (err) {
          console.error('Error fetching data:', err);
          if (isMounted) setError(`Failed to load data: ${err.message}`);
        } finally {
          if (isMounted) setLoading(false);
        }
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    }, [params, router]);

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>;
    if (error) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-500 p-4">{error}</div>;
    if (!user) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Redirecting...</div>;

    const { role, companyId } = params;

    return (
      <DashboardLayout role={role} companyId={companyId}>
        <h1 className="text-2xl mb-4 text-white font-bold">Vendor Dashboard - {companyId}</h1>
        <div className="p-4 bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl mb-2 text-white font-semibold">Assigned Tasks</h2>
          {tasks.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {tasks.map(task => (
                <li key={task.id} className="text-white">
                  <span className="font-medium">{task.title || 'No title'}</span>
                  {task.description && <span className="ml-2 text-gray-300">- {task.description}</span>}
                  <span className="ml-4 text-xs text-gray-500">{new Date(task.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No tasks yet. Check back for updates from your admin.</p>
          )}
        </div>
        <div className="p-4 bg-gray-800 rounded-lg shadow-md mt-4">
          <h2 className="text-xl mb-2 text-white font-semibold">Assigned Jobs</h2>
          {jobs.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {jobs.map(job => (
                <li key={job.id} className="text-white">
                  <span className="font-medium">{job.title || 'No title'}</span>
                  {job.description && <span className="ml-2 text-gray-300">- {job.description}</span>}
                  <span className="ml-4 text-xs text-gray-500">{new Date(job.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No jobs yet.</p>
          )}
        </div>
        <div className="p-4 bg-gray-800 rounded-lg shadow-md mt-4">
          <h2 className="text-xl mb-2 text-white font-semibold">Shared Files</h2>
          {shares.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {shares.map(share => (
                <li key={share.id} className="text-white">
                  <span className="font-medium">{share.filePath || 'No file'}</span>
                  {share.createdAt && <span className="ml-2 text-gray-300">- {new Date(share.createdAt.seconds * 1000).toLocaleDateString()}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No shared files yet.</p>
          )}
        </div>
      </DashboardLayout>
    );
  }