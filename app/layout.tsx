import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { Navbar } from "@/components/common/Navbar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SigmaPay - Cross-Border Payments Made Simple",
  description: "Send money home instantly with near-zero fees using RLUSD on the XRP Ledger. Fast, secure, and verified cross-border remittance.",
  keywords: ["remittance", "XRPL", "RLUSD", "cross-border", "payment", "crypto", "stablecoin", "SigmaPay", "DID", "verification"],
  authors: [{ name: "SigmaPay Team" }],
  openGraph: {
    title: "SigmaPay - Cross-Border Payments Made Simple",
    description: "Send money home instantly with near-zero fees using RLUSD on the XRP Ledger.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <WalletProvider>
          <Navbar />
          <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            {children}
          </main>
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
