import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Northwestern Dining Hall Meal Finder",
  description: "Find the perfect meal at Northwestern dining halls based on your nutrition goals",
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
