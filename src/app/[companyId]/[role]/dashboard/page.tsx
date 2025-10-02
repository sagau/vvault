import { auth } from '@/lib/firebase';
  import { redirect } from 'next/navigation';
  import DashboardLayout from '@/components/DashboardLayout';
  import { collection, getDocs } from 'firebase/firestore';
  import { db } from '@/lib/firebase';

  export default async function DashboardPage({ params }) {
    console.log('Starting DashboardPage render with params:', params); // Debug params
    let user = auth.currentUser;
    if (!user) {
      console.warn('No current user on initial check, attempting to get fresh user');
      // Force refresh of user if null (server-side might not have session)
      const token = await auth.getIdToken(); // Attempt to refresh token
      user = auth.currentUser; // Re-check after token refresh
      if (!user) {
        console.error('No authenticated user after refresh, redirecting to login');
        redirect('/login');
      }
    }

    const { role, companyId } = params;
    console.log('Checking claims for:', { role, companyId, user }); // Debug user context
    const claims = (await user.getIdTokenResult()).claims;
    if (claims.role !== role || claims.companyId !== companyId || role !== 'vendor') {
      console.error('Unauthorized access, redirecting to unauthorized', { claims, role, companyId });
      redirect('/unauthorized');
    }

    let tasks = [];
    try {
      console.log('Fetching tasks for company:', companyId);
      const tasksSnapshot = await getDocs(collection(db, `companies/${companyId}/tasks`));
      tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Fetched tasks:', tasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }

    console.log('Rendering Dashboard with tasks:', tasks);
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