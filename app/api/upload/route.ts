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

    // LOG INI — cek di Vercel logs
    console.log("[upload] driveId:", driveId);
    console.log("[upload] folderId:", folderId);
    console.log("[upload] file:", file?.name, file?.type);

    if (!file) {
      return NextResponse.json({ error: "File tidak ada" }, { status: 400 });
    }
    if (!driveId) {
      return NextResponse.json({ error: "driveId kosong — folder belum punya Drive ID" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const driveRes = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [driveId],
      },
      media: {
        mimeType: file.type || "image/jpeg",
        body: Readable.from(buffer),
      },
      fields: "id, name, webViewLink",
    });

    console.log("[upload] Drive file created:", driveRes.data.id, driveRes.data.name);

    // Update Firestore
    const folderRef = adminDb.collection("folders").doc(folderId);
    const folderSnap = await folderRef.get();
    const currentTotal = folderSnap.data()?.totalFiles || 0;
    await folderRef.update({ totalFiles: currentTotal + 1 });

    return NextResponse.json({ 
      success: true, 
      fileId: driveRes.data.id,
      fileName: driveRes.data.name 
    });
  } catch (error: any) {
    console.error("[upload] ERROR:", error.message, error.code);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
}