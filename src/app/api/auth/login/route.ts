import { NextResponse } from "next/server";
import { cookieName, createAdminToken } from "@/lib/auth";
import { getAdminCredentials } from "@/lib/admin-credentials";
import connectToDatabase from "@/lib/db";
import LoginAttempt from "@/models/LoginAttempt";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

  try {
    await connectToDatabase();

    // Check failed attempts limit (5 attempts in 15 min)
    const windowStart = new Date(Date.now() - 15 * 60 * 1000);
    const failedCount = await LoginAttempt.countDocuments({
      ip,
      createdAt: { $gte: windowStart },
    });

    if (failedCount >= 5) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again after 15 minutes." },
        { status: 429 }
      );
    }

    // Progressive slow-down: after 2 failed attempts, add 500ms delay per attempt
    if (failedCount >= 2) {
      const delayMs = (failedCount - 2 + 1) * 500;
      const cappedDelayMs = Math.min(delayMs, 10000);
      await new Promise((resolve) => setTimeout(resolve, cappedDelayMs));
    }
  } catch (error) {
    console.error("Rate limiting check error:", error);
    // Continue login attempt if rate limiting check fails to avoid lockouts on DB issues
  }

  const body = await request.json().catch(() => ({}));
  const username = body?.username;
  const password = body?.password;
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }

  const { username: adminUsername, password: adminPassword } = getAdminCredentials();

  if (!adminUsername || !adminPassword) {
    return NextResponse.json({ error: "Admin credentials are not configured on the server." }, { status: 503 });
  }

  const normalizedUsername = username.trim().toLowerCase();
  const expectedUsername = adminUsername.trim().toLowerCase();
  if (normalizedUsername !== expectedUsername || password !== adminPassword) {
    try {
      await LoginAttempt.create({ ip });
    } catch (error) {
      console.error("Failed to record login attempt:", error);
    }
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // Clear failed attempts on successful login
  try {
    await LoginAttempt.deleteMany({ ip });
  } catch (error) {
    console.error("Failed to clear login attempts:", error);
  }

  const token = createAdminToken("env-admin", adminUsername);
  const response = NextResponse.json({ ok: true, token });
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}
