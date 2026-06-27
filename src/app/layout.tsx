import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kavacha AI | Kannada Crime Intelligence Copilot",
  description:
    "Secure Kannada and English crime intelligence copilot for authorised Karnataka State Police workflows.",
  applicationName: "Kavacha AI"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
