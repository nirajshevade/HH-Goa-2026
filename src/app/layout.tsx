import type { Metadata, Viewport } from "next";
import { COLORS, EVENT } from "@/lib/brand";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

const title = "HH Goa 2026 Builder Identity";
const description =
  "Drop in your photo and get a share-ready HH Goa 2026 graphic in seconds. No signup, no crop, no fuss.";

export const metadata: Metadata = {
  title: { default: title, template: "%s · HH Goa 2026" },
  description,
  applicationName: "HH Goa 2026",
  openGraph: {
    title,
    description,
    type: "website",
    siteName: EVENT.studio,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: COLORS.green,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh bg-goa-green text-goa-cream antialiased">
        {children}
      </body>
    </html>
  );
}
