import { auth } from '@/lib/firebase'; // Use the exported auth instance
  import { redirect } from 'next/navigation';
  import DashboardLayout from '@/components/DashboardLayout';

  export default async function DashboardPage({ params }) {
    const user = auth.currentUser; // Use auth instance directly
    if (!user) redirect('/login');

    const { role, companyId } = params;
    const claims = (await user.getIdTokenResult()).claims;
    if (claims.role !== role || claims.companyId !== companyId || role !== 'vendor') {
      redirect('/unauthorized');
    }

    return (
      <DashboardLayout role={role} companyId={companyId}>
        <h1 className="text-2xl mb-4">Vendor Dashboard - {companyId}</h1>
        <div className="p-4 bg-gray-800 rounded">
          <h2 className="text-xl mb-2">Assigned Tasks</h2>
          <p className="mb-2">No tasks yet. Check back for updates from your admin.</p>
        </div>
      </DashboardLayout>
    );
  }