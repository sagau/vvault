"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import withGuard from "@/utils/withGuard";

function AdminDashboard() {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const [vendors, setVendors] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const loadData = async () => {
      const vendorsSnap = await getDocs(collection(db, "companies", companyId, "vendors"));
      const jobsSnap = await getDocs(collection(db, "companies", companyId, "jobs"));

      setVendors(vendorsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setJobs(jobsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      setLoading(false);
    };
    loadData();
  }, [companyId]);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <h2 className="text-xl font-semibold mb-2">Vendors</h2>
      <ul>
        {vendors.map((v) => (
          <li key={v.id}>{v.name}</li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Jobs</h2>
      <ul>
        {jobs.map((j) => (
          <li key={j.id}>{j.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default withGuard(AdminDashboard, ["admin"]);
