import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { drive } from "@/lib/drive";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await adminAuth.verifyIdToken(token);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const driveId = formData.get("driveId") as string;
    const folderId = formData.get("folderId") as string;

    if (!file || !driveId) {
      return NextResponse.json({ error: "File atau folder tidak valid" }, { status: 400 });
    }

    // Convert file ke buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload ke Google Drive
    await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [driveId],
      },
      media: {
        mimeType: file.type,
        body: require("stream").Readable.from(buffer),
      },
      fields: "id, name",
    });

    // Update total files di Firestore
    const folderRef = adminDb.collection("folders").doc(folderId);
    const folderSnap = await folderRef.get();
    const currentTotal = folderSnap.data()?.totalFiles || 0;
    await folderRef.update({ totalFiles: currentTotal + 1 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};