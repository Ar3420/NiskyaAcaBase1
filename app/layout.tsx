import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Niskayuna Academic Database",
  description: "A Helix Research and Development academic knowledge project.",
  icons: {
    icon: "/na-database-logo.png",
    shortcut: "/na-database-logo.png",
    apple: "/na-database-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
