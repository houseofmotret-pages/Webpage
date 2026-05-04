import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    const user = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    await adminDb.collection("users").doc(user.uid).set({
      name,
      email,
      role: "photographer",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, uid: user.uid });
  } catch (error: any) {
    console.error("CREATE USER ERROR:", error.code, error.message);
    return NextResponse.json({ 
      error: error.message,
      code: error.code 
    }, { status: 500 });
  }
}