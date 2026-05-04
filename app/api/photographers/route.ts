import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Buat user di Firebase Auth
    const user = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Simpan ke Firestore
    await adminDb.collection("users").doc(user.uid).set({
      name,
      email,
      role: "photographer",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, uid: user.uid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}