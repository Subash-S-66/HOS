import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const cookieName = "hos_admin_session";
const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be configured in production");
  return value || "development-only-change-this-secret";
};
export const createAdminToken = (id: string, username: string) => jwt.sign({ sub: id, username, role: "admin" }, secret(), { expiresIn: "8h" });
export const verifyAdminToken = (token?: string) => { try { const payload = token && jwt.verify(token, secret()); return payload && typeof payload === "object" && payload.role === "admin" ? payload : null; } catch { return null; } };
export async function getAdminSession() { return verifyAdminToken((await cookies()).get(cookieName)?.value); }
export { cookieName };
