"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export default function FoldersPage() {
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFolders(); }, []);

  async function loadFolders() {
    const snap = await getDocs(query(collection(db, "folders"), orderBy("createdAt", "desc")));
    setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Folder Drive</h2>
        <p className="text-gray-500 text-sm mt-1">Semua folder yang dibuat fotografer</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuat...</div>
        ) : folders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Belum ada folder</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Nama Acara</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Fotografer</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Total File</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Tanggal</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {folders.map(f => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 text-sm font-medium text-gray-900">{f.name}</td>
                  <td className="p-4 text-sm text-gray-500">{f.createdByName || "-"}</td>
                  <td className="p-4 text-sm text-gray-500">{f.totalFiles || 0} foto</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${f.status === "ready" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                      {f.status === "ready" ? "Siap" : "Upload"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {f.createdAt?.toDate?.()?.toLocaleDateString("id-ID") || "-"}
                  </td>
                  <td className="p-4">
                    <a href={`/admin/clients?folderId=${f.id}&folderName=${encodeURIComponent(f.name)}`} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition">
                      Generate Link
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}