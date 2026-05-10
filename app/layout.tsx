import type { Metadata } from "next";
import { CartProvider } from "@/components/CartProvider";
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
  title: "Studio Amrita | Handmade Glow Bears & Gifts",
  description:
    "Handmade crochet bears and skincare minis — thoughtful, gift-ready pieces from Studio Amrita.",
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
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
