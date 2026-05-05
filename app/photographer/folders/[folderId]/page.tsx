"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function FolderUploadPage() {
  const params = useParams();
  const folderId = params?.folderId as string;
  const [folder, setFolder] = useState<any>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (folderId) loadFolder();
  }, [folderId]);

  async function loadFolder() {
    try {
      const snap = await getDoc(doc(db, "folders", folderId));
      if (snap.exists()) setFolder({ id: snap.id, ...snap.data() });
    } catch (err) {
      console.error("loadFolder error:", err);
    }
  }

  async function handleSelesai() {
    setMarking(true);
    try {
      await updateDoc(doc(db, "folders", folderId), { status: "ready" });
      await loadFolder();
    } finally {
      setMarking(false);
    }
  }

  if (!folder) {
    return <div className="p-8 text-center text-gray-400">Memuat...</div>;
  }

  const embedUrl = "https://drive.google.com/embeddedfolderview?id=" + folder.driveId + "#grid";

  return (
    <div className="p-6">
      <div className="mb-6">
        <a href="/photographer/dashboard" className="text-sm text-gray-400 hover:text-gray-600 mb-3 block">
          Kembali
        </a>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{folder.name}</h2>
            <p className="text-gray-500 text-sm mt-1">{folder.totalFiles || 0} foto</p>
          </div>
          <div className="flex gap-3">
            
             <a> href={folder.driveLink}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition"
            
              Buka di Drive
            </a>
            <button
              onClick={handleSelesai}
              disabled={marking || folder.status === "ready"}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
            >
              {marking ? "Menyimpan..." : folder.status === "ready" ? "Sudah Selesai" : "Tandai Selesai Upload"}
            </button>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 text-sm text-blue-700">
        Upload foto langsung ke folder di bawah ini. Setelah selesai, klik Tandai Selesai Upload.
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <iframe
          src={embedUrl}
          className="w-full"
          style={{ height: "600px", border: "none" }}
          title="Google Drive Folder"
        />
      </div>
    
    </div>
  );
}
 