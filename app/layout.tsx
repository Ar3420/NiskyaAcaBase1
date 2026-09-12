import type { Metadata } from "next";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "Niskayuna Academic Database",
  description: "By Helix R&D.",
  icons: {
    icon: "/Helixico.ico",
    shortcut: "/Helixico.ico",
    apple: "/Helixico.ico",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
