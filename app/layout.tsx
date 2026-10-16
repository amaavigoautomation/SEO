import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Growth OS",
  description: "Brand-aware AI content chat",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en">
      <body>
        {session && (
          <nav>
            <Link className="brand" href="/">Growth OS</Link>
            <Link href="/">Chats</Link>
            <Link href="/chat/new">New chat</Link>
            <Link href="/brands">Brands</Link>
            <span className="spacer" />
            <span className="who">{session.name}</span>
            <LogoutButton />
          </nav>
        )}
        <main>{children}</main>
      </body>
    </html>
  );
}
