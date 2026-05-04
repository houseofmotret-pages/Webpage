import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { createFolder } from "@/lib/drive";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);

    const { name, userName } = await request.json();

    // Buat folder di Google Drive
    const driveFolder = await createFolder(name);

    // Simpan ke Firestore
    const folderRef = await adminDb.collection("folders").add({
      name,
      driveId: driveFolder.id,
      driveLink: driveFolder.webViewLink,
      createdBy: decoded.uid,
      createdByName: userName,
      totalFiles: 0,
      status: "uploading",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, folderId: folderRef.id, driveId: driveFolder.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}