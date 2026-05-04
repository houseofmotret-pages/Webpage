import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { setFolderPermission } from "@/lib/drive";

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const { folderId, folderName, clientName, maxSelect, accessRole } = await request.json();

    // Set permission folder di Drive
    const folderDoc = await adminDb.collection("folders").doc(folderId).get();
    const driveId = folderDoc.data()?.driveId;

    if (driveId) {
      await setFolderPermission(driveId, accessRole);
    }

    // Generate token unik
    const token = generateToken();

    // Simpan ke Firestore
    const clientRef = await adminDb.collection("clients").add({
      folderId,
      folderName,
      clientName,
      maxSelect,
      accessRole,
      token,
      status: "pending",
      selectedFiles: [],
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, token, clientId: clientRef.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}