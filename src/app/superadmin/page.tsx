"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import withGuard from "@/utils/withGuard";

function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const companiesSnap = await getDocs(collection(db, "companies"));
      const usersSnap = await getDocs(collection(db, "users"));

      setCompanies(companiesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setUsers(usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">SuperAdmin Dashboard</h1>
      <h2 className="text-xl font-semibold mb-2">Companies</h2>
      <ul>
        {companies.map((c) => (
          <li key={c.id}>{c.name} ({c.id})</li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Users</h2>
      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.email} — {u.role}</li>
        ))}
      </ul>
    </div>
  );
}

export default withGuard(SuperAdminDashboard, ["superadmin"]);
