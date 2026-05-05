import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { drive } from "@/lib/drive";
import { Readable } from "stream";

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

    const buffer = Buffer.from(await file.arrayBuffer());

    await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: file.name,
        parents: [driveId],
      },
      media: {
        mimeType: file.type,
        body: Readable.from(buffer),
      },
      fields: "id, name",
    });

    const folderRef = adminDb.collection("folders").doc(folderId);
    const folderSnap = await folderRef.get();
    const currentTotal = folderSnap.data()?.totalFiles || 0;
    await folderRef.update({ totalFiles: currentTotal + 1 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Upload error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}