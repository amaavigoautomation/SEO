import { cookies } from "next/headers";
import { COOKIE, verifySession } from "./auth";

export async function getSession(): Promise<{ name: string } | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? verifySession(token) : null;
}
