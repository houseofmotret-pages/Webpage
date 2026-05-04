"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PhotographerDashboard() {
  const [stats, setStats] = useState({ totalFolders: 0, totalFiles: 0 });
  const [recentFolders, setRecentFolders] = useState<any[]>([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUserName(user.displayName || user.email || "");

      const snap = await getDocs(query(collection(db, "folders"), where("createdBy", "==", user.uid)));
      const folders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalFiles = folders.reduce((acc: number, f: any) => acc + (f.totalFiles || 0), 0);

      setStats({ totalFolders: folders.length, totalFiles });
      setRecentFolders(folders.slice(0, 5));
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Halo, {userName} 👋</h2>
        <p className="text-gray-500 text-sm mt-1">Selamat datang di panel fotografer</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: "Total Folder", value: stats.totalFolders, icon: "📁", color: "bg-purple-50 text-purple-600" },
          { label: "Total Foto", value: stats.totalFiles, icon: "🖼️", color: "bg-blue-50 text-blue-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center text-lg mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Action</h3>
        <a href="/photographer/folders/new" className="flex items-center gap-3 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
          <span className="text-2xl">📁</span>
          <div>
            <div className="text-sm font-medium text-gray-900">Buat Folder Baru</div>
            <div className="text-xs text-gray-400">Upload foto acara baru</div>
          </div>
        </a>
      </div>

      {recentFolders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Folder Terbaru</h3>
          <div className="space-y-3">
            {recentFolders.map(f => (
              <a key={f.id} href={`/photographer/folders/${f.id}`} className="flex items-center justify-between p-3 border border-gray-50 rounded-lg hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📁</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{f.name}</div>
                    <div className="text-xs text-gray-400">{f.totalFiles || 0} foto</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${f.status === "ready" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                  {f.status === "ready" ? "Siap" : "Upload"}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}