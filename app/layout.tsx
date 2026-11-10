import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { isDemoMode } from "@/lib/store";

export const metadata: Metadata = {
  title: "Share the Luv",
  description: "Swipe right to pay a stranger's bill. Money goes straight to the biller.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f43f5e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode();
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <header className="sticky top-0 z-20 backdrop-blur bg-paper/80 border-b border-luv-100">
          <nav className="mx-auto max-w-md flex items-center justify-between px-4 h-14">
            <Link href="/" className="font-bold text-lg tracking-tight">
              share the <span className="text-luv-600">luv</span> <span aria-hidden>💗</span>
            </Link>
            <div className="flex gap-4 text-sm font-medium">
              <Link href="/swipe" className="hover:text-luv-600">Swipe</Link>
              <Link href="/post" className="hover:text-luv-600">Post a bill</Link>
              <Link href="/me" className="hover:text-luv-600">My luvs</Link>
            </div>
          </nav>
          {demo && (
            <div className="bg-amber-100 text-amber-900 text-xs text-center py-1">
              Demo mode — fake bills, nothing is really paid. Add Supabase keys in .env.local to go live.
            </div>
          )}
        </header>
        <main className="flex-1 mx-auto w-full max-w-md px-4 py-6">{children}</main>
        <footer className="text-center text-xs text-stone-500 py-6">
          Direct-to-biller by default, always labeled. © {new Date().getFullYear()} Share the Luv
        </footer>
      </body>
    </html>
  );
}
