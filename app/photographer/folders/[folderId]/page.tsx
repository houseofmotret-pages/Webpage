"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function FolderUploadPage() {
  const { folderId } = useParams();
  const [folder, setFolder] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<any[]>([]);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadFolder(); }, [folderId]);

  async function loadFolder() {
    const snap = await getDoc(doc(db, "folders", folderId as string));
    if (snap.exists()) setFolder({ id: snap.id, ...snap.data() });
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setTotal(files.length);
    setDone(0);
    setUploading(true);
    setUploadQueue(files.map(f => ({ name: f.name, status: "pending" })));

    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();

    let completed = 0;
    for (const file of files) {
      setUploadQueue(prev => prev.map(q => q.name === file.name ? { ...q, status: "uploading" } : q));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("driveId", folder.driveId);
      formData.append("folderId", folderId as string);

      try {
        await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        setUploadQueue(prev => prev.map(q => q.name === file.name ? { ...q, status: "done" } : q));
      } catch {
        setUploadQueue(prev => prev.map(q => q.name === file.name ? { ...q, status: "error" } : q));
      }

      completed++;
      setDone(completed);
    }

    // Update status folder
    await updateDoc(doc(db, "folders", folderId as string), {
      status: "ready",
      totalFiles: (folder.totalFiles || 0) + completed,
    });

    setUploading(false);
    loadFolder();
  }

  if (!folder) return <div className="p-8 text-center text-gray-400">Memuat...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <a href="/photographer/dashboard" className="text-sm text-gray-400 hover:text-gray-600 mb-4 block">← Kembali</a>
        <h2 className="text-2xl font-bold text-gray-900">{folder.name}</h2>
        <p className="text-gray-500 text-sm mt-1">{folder.totalFiles || 0} foto sudah diupload</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Upload Foto</h3>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition"
          >
            <div className="text-4xl mb-3">📸</div>
            <div className="text-sm font-medium text-gray-700">Klik untuk pilih foto</div>
            <div className="text-xs text-gray-400 mt-1">JPG, PNG, RAW — file asli tanpa kompresi</div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFiles}
            className="hidden"
          />

          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Mengupload...</span>
                <span>{done} / {total}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gray-900 h-2 rounded-full transition-all"
                  style={{ width: `${(done / total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Info & Status */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Info Folder</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nama Acara</span>
              <span className="text-gray-900 font-medium">{folder.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Foto</span>
              <span className="text-gray-900 font-medium">{folder.totalFiles || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${folder.status === "ready" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                {folder.status === "ready" ? "✅ Siap" : "⏳ Upload"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Google Drive</span>
              <a href={folder.driveLink} target="_blank" className="text-blue-500 hover:underline text-xs">
                Buka Drive →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Progress Upload</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadQueue.map((q, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
                <span className="text-gray-700 truncate flex-1 mr-4">{q.name}</span>
                <span className={`text-xs font-medium ${
                  q.status === "done" ? "text-green-600" :
                  q.status === "error" ? "text-red-500" :
                  q.status === "uploading" ? "text-blue-500" : "text-gray-400"
                }`}>
                  {q.status === "done" ? "✅ Selesai" :
                   q.status === "error" ? "❌ Gagal" :
                   q.status === "uploading" ? "⏳ Upload..." : "Menunggu"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}