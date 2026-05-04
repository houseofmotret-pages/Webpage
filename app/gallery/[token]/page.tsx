"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function GalleryPage() {
  const { token } = useParams();
  const [client, setClient] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState<"gallery" | "review" | "done">("gallery");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/gallery/${token}`);
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setClient(data.client);
      setPhotos(data.photos);
      if (data.client.status === "selesai") setPage("done");
      setLoading(false);
    }
    load();
  }, [token]);

  function toggleSelect(name: string) {
    if (selected.includes(name)) {
      setSelected(selected.filter(s => s !== name));
    } else {
      if (selected.length >= client.maxSelect) return;
      setSelected([...selected, name]);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await fetch(`/api/gallery/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedFiles: selected }),
      });
      setPage("done");
      // Kirim WA notif
      const msg = `Halo *House of Motret* 🌸\n\n*${client.clientName}* sudah selesai memilih *${selected.length} foto*.\n\nSilakan cek dashboard untuk melihat pilihan lengkapnya.`;
      window.open(`https://api.whatsapp.com/send?phone=${process.env.NEXT_PUBLIC_WA_ADMIN}&text=${encodeURIComponent(msg)}`, "_blank");
    } catch {
      alert("Gagal mengirim pilihan!");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-4">🌸</div>
        <div>Membuka galeri...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-4">😔</div>
        <div>{error}</div>
      </div>
    </div>
  );

  if (page === "done") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm mx-auto px-6">
        <div className="text-6xl mb-6">🌸</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Terima Kasih!</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Pilihan foto Anda telah kami terima. Tim House of Motret akan segera memproses permintaan Anda.
        </p>
        <div className="bg-white border border-gray-100 rounded-xl px-6 py-4 text-sm text-gray-600">
          ✅ Pilihan tersimpan
        </div>
        {client?.status !== "selesai" && selected.length > 0 && (
          <p className="text-xs text-gray-400 mt-4">
            {selected.length} foto telah dipilih
          </p>
        )}
      </div>
    </div>
  );

  if (page === "review") return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Review Pilihan</div>
        <h2 className="font-bold text-gray-900">Foto Terpilih — {selected.length} foto</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5 p-0.5 pb-32">
        {selected.map(name => {
          const photo = photos.find(p => p.name === name);
          return photo ? (
            <div key={name} className="aspect-square relative overflow-hidden bg-gray-100">
              <img src={photo.thumb} alt={name} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <div className="text-white text-xs truncate">{name}</div>
              </div>
            </div>
          ) : null;
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button onClick={() => setPage("gallery")} className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition">
            ←
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-gray-900 text-white py-3 rounded-full font-medium hover:bg-gray-700 transition disabled:opacity-50">
            {submitting ? "Mengirim..." : "Kirim Pilihan 🌸"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-gray-900 text-sm">House of Motret</div>
          <div className="text-xs text-gray-400">{client?.clientName}</div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>Foto dipilih</span>
          <span className="font-bold text-gray-900">{selected.length} / {client?.maxSelect}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-gray-900 h-1.5 rounded-full transition-all"
            style={{ width: `${(selected.length / client?.maxSelect) * 100}%` }}
          />
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5 p-0.5 pb-24">
        {photos.map(photo => (
          <div
            key={photo.name}
            onClick={() => toggleSelect(photo.name)}
            className={`aspect-square relative overflow-hidden bg-gray-100 cursor-pointer ${selected.includes(photo.name) ? "ring-2 ring-gray-900 ring-inset" : ""}`}
          >
            <img src={photo.thumb} alt={photo.name} className="w-full h-full object-cover" loading="lazy" />
            {selected.includes(photo.name) && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent">
        <button
          onClick={() => setPage("review")}
          disabled={selected.length === 0}
          className="w-full max-w-lg mx-auto block bg-gray-900 text-white py-3.5 rounded-full font-medium hover:bg-gray-700 transition disabled:opacity-30"
        >
          Lihat Pilihan ({selected.length})
        </button>
      </div>
    </div>
  );
}