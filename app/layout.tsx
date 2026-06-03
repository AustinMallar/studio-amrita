import type { Metadata } from "next";
import { CartProvider } from "@/components/CartProvider";
import { JsonLd } from "@/components/JsonLd";
import { NavigationProgress } from "@/components/loading/NavigationProgress";
import { ScrollToTop } from "@/components/ScrollToTop";
import { siteWideSchemas } from "@/lib/schema";
import { SITE } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";
import { Cormorant_Garamond, Jost, Quicksand } from "next/font/google";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displaySerif = Cormorant_Garamond({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Studio Amrita | Crochet Bear Keychain & Handmade Gifts",
  description: SITE.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jost.variable} ${displaySerif.variable} ${quicksand.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-cream font-sans text-body">
        <JsonLd data={siteWideSchemas()} />
        <CartProvider>
          <ScrollToTop />
          <NavigationProgress />
          {children}
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
