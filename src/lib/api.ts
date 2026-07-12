const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const socketBase = process.env.NEXT_PUBLIC_SOCKET_URL
  ? trimTrailingSlash(process.env.NEXT_PUBLIC_SOCKET_URL).replace(/^ws/i, "http")
  : "";

export const apiUrl = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL || (socketBase ? `${socketBase}/api` : "http://localhost:4000/api"),
);
export const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || "Request failed"); }
  return response.status === 204 ? undefined as T : response.json();
}
