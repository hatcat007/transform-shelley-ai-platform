import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
export async function getWorkspace() {
  const jar = await cookies();
  const existing = jar.get("shelley_station_workspace")?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing;
  const id = randomUUID();
  jar.set("shelley_station_workspace", id, {
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 31536000,
  });
  return id;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site")
    throw new Error("Cross-origin writes are not permitted.");
  if (origin) {
    let host: string;
    try {
      host = new URL(origin).host;
    } catch {
      throw new Error("Cross-origin writes are not permitted.");
    }
    if (host !== request.headers.get("host"))
      throw new Error("Cross-origin writes are not permitted.");
  }
}
