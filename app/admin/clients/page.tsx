"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ClientsContent() {
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    folderId: searchParams.get("folderId") || "",
    folderName: searchParams.get("folderName") || "",
    clientName: "",
    maxSelect: 10,
    accessRole: "reader",
  });
  const [saving, setSaving] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [waMessage, setWaMessage] = useState("");

  useEffect(() => {
    loadData();
    if (searchParams.get("folderId")) setShowForm(true);
  }, []);

  async function loadData() {
    const clientsSnap = await getDocs(query(collection(db, "clients"), orderBy("createdAt", "desc")));
    const foldersSnap = await getDocs(query(collection(db, "folders"), orderBy("createdAt", "desc")));
    setClients(clientsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setFolders(foldersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      const link = `${window.location.origin}/gallery/${data.token}`;
      setGeneratedLink(link);
      setWaMessage(`Halo *${form.clientName}* 🌸\n\nTerima kasih telah mempercayakan momen spesial Anda kepada kami.\n\nSilakan pilih *${form.maxSelect} foto* terbaik Anda melalui link berikut:\n👉 ${link}\n\nJika ada pertanyaan, jangan ragu menghubungi kami.\n\nSalam hangat,\n*House of Motret* 🌸`);
      loadData();
    } catch {
      alert("Gagal generate link!");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlock(clientId: string) {
    await updateDoc(doc(db, "clients", clientId), { status: "pending", lockedAt: null });
    loadData();
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert("Disalin!");
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Klien</h2>
          <p className="text-gray-500 text-sm mt-1">Generate & kelola link klien</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
        >
          + Generate Link
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Generate Link Klien</h3>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Pilih Folder</label>
              <select
                value={form.folderId}
                onChange={e => {
                  const folder = folders.find(f => f.id === e.target.value);
                  setForm({...form, folderId: e.target.value, folderName: folder?.name || ""});
                }}
                className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              >
                <option value="">Pilih folder...</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.createdByName})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Klien</label>
              <input
                type="text"
                value={form.clientName}
                onChange={e => setForm({...form, clientName: e.target.value})}
                className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Contoh: Wedding Budi & Sari"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Batas Pilih Foto</label>
                <input
                  type="number"
                  value={form.maxSelect}
                  onChange={e => setForm({...form, maxSelect: parseInt(e.target.value)})}
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  min={1}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Akses Klien</label>
                <select
                  value={form.accessRole}
                  onChange={e => setForm({...form, accessRole: e.target.value})}
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="reader">👁️ Lihat saja</option>
                  <option value="commenter">💬 Komentar</option>
                  <option value="writer">✏️ Edit</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50">
                {saving ? "Generating..." : "Generate Link"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setGeneratedLink(""); }} className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                Batal
              </button>
            </div>
          </form>

          {generatedLink && (
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="text-sm font-medium text-green-800 mb-2">✅ Link berhasil dibuat!</div>
              <div className="flex gap-2 mb-4">
                <input value={generatedLink} readOnly className="flex-1 px-3 py-2 bg-white border border-green-200 rounded-lg text-sm text-gray-700" />
                <button onClick={() => copyToClipboard(generatedLink)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
                  Copy
                </button>
              </div>
              <div className="text-xs font-medium text-gray-600 mb-2">Pesan WA:</div>
              <textarea value={waMessage} readOnly rows={6} className="w-full px-3 py-2 bg-white border border-green-200 rounded-lg text-sm text-gray-700 resize-none" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => copyToClipboard(waMessage)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">
                  Copy Pesan
                </button>
                <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`} target="_blank" className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm text-center hover:bg-green-600 transition">
                  Kirim WA
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuat...</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Belum ada klien</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Nama Klien</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Folder</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Pilihan</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 text-sm font-medium text-gray-900">{c.clientName}</td>
                  <td className="p-4 text-sm text-gray-500">{c.folderName}</td>
                  <td className="p-4 text-sm text-gray-500">{c.selectedFiles?.length || 0} / {c.maxSelect}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.status === "selesai" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                      {c.status === "selesai" ? "Selesai 🔒" : "Pending"}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => copyToClipboard(`${window.location.origin}/gallery/${c.token}`)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                      Copy Link
                    </button>
                    {c.status === "selesai" && (
                      <button onClick={() => handleUnlock(c.id)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                        Unlock
                      </button>
                    )}
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

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Memuat...</div>}>
      <ClientsContent />
    </Suspense>
  );
}