import type { Metadata } from "next";
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
        <div className="page-fade">{children}</div>
      </body>
    </html>
  );
}
