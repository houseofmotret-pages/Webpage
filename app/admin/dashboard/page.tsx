"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalFolders: 0,
    totalClients: 0,
    pending: 0,
    selesai: 0,
    totalPhotographers: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const foldersSnap = await getDocs(collection(db, "folders"));
      const clientsSnap = await getDocs(collection(db, "clients"));
      const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "photographer")));

      const pending = clientsSnap.docs.filter(d => d.data().status === "pending").length;
      const selesai = clientsSnap.docs.filter(d => d.data().status === "selesai").length;

      setStats({
        totalFolders: foldersSnap.size,
        totalClients: clientsSnap.size,
        pending,
        selesai,
        totalPhotographers: usersSnap.size,
      });
    }
    loadStats();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Overview semua aktivitas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Fotografer", value: stats.totalPhotographers, icon: "👤", color: "bg-blue-50 text-blue-600" },
          { label: "Total Folder", value: stats.totalFolders, icon: "📁", color: "bg-purple-50 text-purple-600" },
          { label: "Klien Pending", value: stats.pending, icon: "⏳", color: "bg-yellow-50 text-yellow-600" },
          { label: "Klien Selesai", value: stats.selesai, icon: "✅", color: "bg-green-50 text-green-600" },
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

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <a href="/admin/photographers" className="flex items-center gap-3 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
            <span className="text-2xl">👤</span>
            <div>
              <div className="text-sm font-medium text-gray-900">Tambah Fotografer</div>
              <div className="text-xs text-gray-400">Buat akun baru</div>
            </div>
          </a>
          <a href="/admin/clients" className="flex items-center gap-3 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
            <span className="text-2xl">🖼️</span>
            <div>
              <div className="text-sm font-medium text-gray-900">Generate Link Klien</div>
              <div className="text-xs text-gray-400">Buat link pilih foto</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}