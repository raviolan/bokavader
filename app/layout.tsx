import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Book the Weather",
  description: "Reserve the weather for fun with a shared public calendar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
