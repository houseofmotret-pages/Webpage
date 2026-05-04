import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getFolderFiles } from "@/lib/drive";

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;

    // Cari client berdasarkan token
    const clientsSnap = await adminDb.collection("clients").where("token", "==", token).limit(1).get();
    if (clientsSnap.empty) {
      return NextResponse.json({ error: "Link tidak valid!" }, { status: 404 });
    }

    const clientDoc = clientsSnap.docs[0];
    const client = { id: clientDoc.id, ...clientDoc.data() };

    // Ambil folder dari Firestore
    const folderDoc = await adminDb.collection("folders").doc((client as any).folderId).get();
    const driveId = folderDoc.data()?.driveId;

    // Ambil foto dari Drive
    const files = await getFolderFiles(driveId);
    const photos = files.map((f: any) => ({
      name: f.name,
      thumb: `https://drive.google.com/thumbnail?id=${f.id}&sz=w600`,
      id: f.id,
    }));

    return NextResponse.json({ client, photos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    const { selectedFiles } = await request.json();

    // Cari client
    const clientsSnap = await adminDb.collection("clients").where("token", "==", token).limit(1).get();
    if (clientsSnap.empty) {
      return NextResponse.json({ error: "Link tidak valid!" }, { status: 404 });
    }

    const clientDoc = clientsSnap.docs[0];

    // Update status & simpan pilihan
    await adminDb.collection("clients").doc(clientDoc.id).update({
      selectedFiles,
      status: "selesai",
      submittedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}