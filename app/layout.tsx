import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Robert E. Dickinson — In Loving Memory",
  description: "A living memorial honoring Robert E. Dickinson, pioneering climate scientist, teacher, and mentor.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
