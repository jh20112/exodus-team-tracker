import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EXODUS Team Tracker",
  description: "Weekly check-in tracker for the Exodus team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
