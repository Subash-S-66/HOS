import { NextResponse } from "next/server";
import { cookieName, createAdminToken } from "@/lib/auth";
import { getAdminCredentials } from "@/lib/admin-credentials";

export async function POST(request: Request) {
  const body = await request.json();
  const username = body?.username;
  const password = body?.password;
  if (typeof username !== "string" || typeof password !== "string") return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });

  const { username: adminUsername, password: adminPassword } = getAdminCredentials();

  if (!adminUsername || !adminPassword) {
    return NextResponse.json({ error: "Admin credentials are not configured on the server." }, { status: 503 });
  }

  const normalizedUsername = username.trim().toLowerCase();
  const expectedUsername = adminUsername.trim().toLowerCase();
  if (normalizedUsername !== expectedUsername || password !== adminPassword) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, createAdminToken("env-admin", adminUsername), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}
