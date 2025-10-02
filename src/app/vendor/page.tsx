"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";

import { useAuth } from "@/hooks/useAuth";
import { auth, db } from "@/lib/firebase";

export default function VendorDashboard() {
  const { user, loading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [shares, setShares] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const companyId = user?.companyId;
  const vendorId = user?.uid;

  useEffect(() => {
    async function loadData() {
      console.log("🔑 VendorDashboard user:", user);
      console.log("🔑 companyId:", companyId, "vendorId:", vendorId);

      if (!companyId || !vendorId) {
        console.warn("⚠️ Missing companyId or vendorId for vendor dashboard");
        setLoadingData(false);
        return;
      }

      try {
        // Shares
        const sharesQuery = query(
          collection(db, "shares"),
          where("companyId", "==", companyId),
          where("vendorId", "==", vendorId)
        );
        const sharesSnapshot = await getDocs(sharesQuery);
        setShares(sharesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        // Tasks
        const tasksQuery = query(
          collection(db, "tasks"),
          where("companyId", "==", companyId),
          where("vendorId", "==", vendorId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        setTasks(tasksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("❌ Error loading vendor data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    if (!loading) {
      loadData();
    }
  }, [loading, companyId, vendorId]);

  if (loading || loadingData) {
    return <div className="p-6">Loading vendor dashboard...</div>;
  }

  // 🚨 No companyId: show warning but still render logout
  if (!companyId) {
    return (
      <div className="p-6">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          <button
            onClick={() => signOut(auth)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </header>
        <p className="text-red-600">
          ⚠️ You are logged in as vendor but no <code>companyId</code> was found in your claims.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        <button
          onClick={() => signOut(auth)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-2">Shared Files</h2>
        {shares.length > 0 ? (
          <ul className="list-disc list-inside">
            {shares.map((share) => (
              <li key={share.id}>{share.fileId || "Unnamed file"}</li>
            ))}
          </ul>
        ) : (
          <p>No files shared with you yet.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Tasks</h2>
        {tasks.length > 0 ? (
          <ul className="list-disc list-inside">
            {tasks.map((task) => (
              <li key={task.id}>{task.title || "Untitled task"}</li>
            ))}
          </ul>
        ) : (
          <p>No tasks assigned yet.</p>
        )}
      </section>
    </div>
  );
}
