import { auth } from '@/lib/firebase';
    import { redirect } from 'next/navigation';
    import DashboardLayout from '@/components/DashboardLayout';
    import { collection, getDocs } from 'firebase/firestore';
    import { db } from '@/lib/firebase';

    export default async function DashboardPage({ params }) {
      const user = auth.currentUser;
      if (!user) redirect('/login');

      const { role, companyId } = params;
      const claims = (await user.getIdTokenResult()).claims;
      if (claims.role !== role || claims.companyId !== companyId || role !== 'vendor') {
        redirect('/unauthorized');
      }

      const tasksSnapshot = await getDocs(collection(db, `companies/${companyId}/tasks`));
      const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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