import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://thehelmspace.com"),
  title: "The Helm Space — Premium Coworking & Meeting Rooms",
  description: "A calmer place to get work done. High-speed redundant fiber internet, 100% backup power, quiet call rooms, and premium workspaces.",
  keywords: [
    "coworking space",
    "private office rental",
    "meeting room booking",
    "shared desk space",
    "reliable electricity workspace",
    "quiet office",
    "business address mail handling",
    "Lagos coworking"
  ],
  openGraph: {
    title: "The Helm Space — Premium Coworking & Meeting Rooms",
    description: "A calmer place to get work done. High-speed redundant fiber internet, 100% backup power, quiet call rooms, and premium workspaces in a stunning design.",
    url: "https://thehelmspace.com",
    siteName: "The Helm Space",
    images: [
      {
        url: "/hero_img.jpg.webp",
        width: 1200,
        height: 630,
        alt: "The Helm Space premium workspace environment",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Helm Space — Premium Coworking & Meeting Rooms",
    description: "A calmer place to get work done. Redundant power, quiet call rooms, and ultra-fast fiber.",
    images: ["/hero_img.jpg.webp"],
  },
  icons: {
    icon: "/THS-FAVICON.svg",
    shortcut: "/THS-FAVICON.svg",
    apple: "/THS-FAVICON.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Google Fonts — preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Caveat:wght@500;600&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&display=swap"
        />
        {/* Tabler Icons */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
