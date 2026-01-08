import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/toaster";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
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
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <WalletProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
