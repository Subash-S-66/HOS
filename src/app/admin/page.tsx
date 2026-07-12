import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import AdminDashboard from "@/components/AdminDashboard";
export default async function AdminPage() { const session = await getAdminSession(); if (!session || typeof session.username !== "string") redirect("/admin/login"); return <AdminDashboard username={session.username} />; }
