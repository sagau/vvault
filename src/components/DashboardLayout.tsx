"use client";

import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ role, companyId, children }) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const navLinks = {
    vendor: [{ href: '/tasks', label: 'Tasks' }],
    admin: [{ href: '/jobs', label: 'Jobs' }, { href: '/vendors', label: 'Vendors' }],
    superAdmin: [{ href: '/companies', label: 'Companies' }, { href: '/admins', label: 'Admins' }],
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <nav className="w-64 bg-gray-800 p-4">
        <h2 className="text-lg mb-4">Navigation</h2>
        <ul>
          {navLinks[role]?.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="block py-2 text-white hover:bg-gray-700">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <button onClick={handleLogout} className="mt-4 w-full p-2 bg-red-600 rounded">
          Logout
        </button>
      </nav>
      <div className="flex-1 flex flex-col">
        <header className="p-4 bg-gray-700">
          <h1 className="text-xl">Dashboard for {role} - {companyId}</h1>
        </header>
        <main className="p-4 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}