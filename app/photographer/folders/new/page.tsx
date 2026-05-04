"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function NewFolderPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();

      const res = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, userId: user.uid, userName: user.displayName || user.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/photographer/folders/${data.folderId}`);
    } catch (err: any) {
      setError(err.message || "Gagal membuat folder!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <a href="/photographer/dashboard" className="text-sm text-gray-400 hover:text-gray-600 mb-4 block">
          ← Kembali
        </a>
        <h2 className="text-2xl font-bold text-gray-900">Buat Folder Baru</h2>
        <p className="text-gray-500 text-sm mt-1">Folder akan otomatis dibuat di Google Drive</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nama Acara</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Contoh: Wedding Budi & Sari - 4 Mei 2026"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Nama ini akan jadi nama folder di Google Drive</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
          >
            {loading ? "Membuat folder..." : "Buat Folder & Mulai Upload"}
          </button>
        </form>
      </div>
    </div>
  );
}