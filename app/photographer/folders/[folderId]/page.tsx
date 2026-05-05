"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

declare global {
  interface Window {
    google: any;
    gapi: any;
    tokenClient: any;
  }
}

export default function FolderUploadPage() {
  const params = useParams();
  const folderId = params?.folderId as string;
  const [folder, setFolder] = useState<any>(null);
  const [uploadQueue, setUploadQueue] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [accessToken, setAccessToken] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (folderId) loadFolder();
    loadGoogleAuth();
  }, [folderId]);

  async function loadFolder() {
    try {
      const snap = await getDoc(doc(db, "folders", folderId));
      if (snap.exists()) setFolder({ id: snap.id, ...snap.data() });
    } catch (err) {
      console.error("loadFolder error:", err);
    }
  }

  function loadGoogleAuth() {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = initTokenClient;
    document.body.appendChild(script);
  }

  function initTokenClient() {
    window.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (response: any) => {
        if (response.access_token) {
          setAccessToken(response.access_token);
        }
      },
    });
  }

  function requestAccess() {
    if (window.tokenClient) {
      window.tokenClient.requestAccessToken();
    }
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!accessToken) {
      alert("Klik 'Hubungkan Google Drive' dulu!");
      return;
    }

    const files = Array.from(e.target.files || []);
    if (!files.length || !folder) return;

    setTotal(files.length);
    setDone(0);
    setUploading(true);
    setUploadQueue(files.map(f => ({ name: f.name, status: "pending" })));

    let completed = 0;
    for (const file of files) {
      setUploadQueue(prev => prev.map(q => q.name === file.name ? { ...q, status: "uploading" } : q));

      try {
        const metadata = {
          name: file.name,
          parents: [folder.driveId],
        };

        const form = new FormData();
        form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        form.append("file", file);

        const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        });

        if (!res.ok) throw new Error("Upload gagal");
        setUploadQueue(prev => prev.map(q => q.name === file.name ? { ...q, status: "done" } : q));
        completed++;
      } catch {
        setUploadQueue(prev => prev.map(q => q.name === file.name ? { ...q, status: "error" } : q));
      }

      setDone(completed);
    }

    await updateDoc(doc(db, "folders", folderId), {
      status: "ready",
      totalFiles: (folder.totalFiles || 0) + completed,
    });

    setUploading(false);
    loadFolder();
  }

  if (!folderId) return <div className="p-8 text-center text-gray-400">Folder tidak ditemukan</div>;
  if (!folder) return <div className="p-8 text-center text-gray-400">Memuat...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <a href="/photographer/dashboard" className="text-sm text-gray-400 hover:text-gray-600 mb-4 block">← Kembali</a>
        <h2 className="text-2xl font-bold text-gray-900">{folder.name}</h2>
        <p className="text-gray-500 text-sm mt-1">{folder.totalFiles || 0} foto sudah diupload</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Upload Foto</h3>

          {!accessToken ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔐</div>
              <p className="text-sm text-gray-500 mb-4">Hubungkan Google Drive lo dulu untuk upload foto</p>
              <button
                onClick={requestAccess}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Hubungkan Google Drive
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                ✅ Google Drive terhubung
              </div>
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
            </>
          )}

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