"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const [docs, setDocs] = useState<{ id: string; data: any }[]>([]);

  useEffect(() => {
    async function loadDocs() {
      const snapshot = await getDocs(collection(db, "test"));
      setDocs(snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })));
    }
    loadDocs();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firestore Test</h1>
      <ul className="space-y-2">
        {docs.map((doc) => (
          <li key={doc.id} className="p-2 border rounded bg-gray-50">
            <strong>ID:</strong> {doc.id}
            <br />
            <strong>Data:</strong> {JSON.stringify(doc.data)}
          </li>
        ))}
      </ul>
    </main>
  );
}
