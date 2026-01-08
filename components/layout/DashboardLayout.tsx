"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import { WalletSetup } from "@/components/wallet/WalletSetup";
import { WalletUnlock } from "@/components/wallet/WalletUnlock";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Skeleton } from "@/components/ui/skeleton";

// Map pathnames to page titles
const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/send": "Send Money",
  "/receive": "Receive",
  "/escrow": "Escrow",
  "/escrow/create": "Create Escrow",
  "/history": "Transaction History",
  "/verify": "Identity Verification",
  "/rwa": "RWA Marketplace",
  "/tokenize": "Tokenize Asset",
  "/trade": "Trade RWA",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { hasWallet, wallet, isLoading } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get page title from pathname
  const pageTitle = pageTitles[pathname] || "SigmaPay";

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Check if we're on a page that should skip the dashboard layout
  const isLandingPage = pathname === "/";
  const isOnboarding = pathname === "/onboarding";

  if (isLandingPage || isOnboarding) {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading && !hasWallet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // No wallet - show setup
  if (!hasWallet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <WalletSetup />
      </div>
    );
  }

  // Has wallet but locked - show unlock
  if (!wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <WalletUnlock />
      </div>
    );
  }

  // Full dashboard layout
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile Sidebar */}
      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:ml-sidebar">
        {/* Header */}
        <Header
          title={pageTitle}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* Page Content */}
        <main className="p-4 lg:p-6 pb-20 lg:pb-6 min-h-[calc(100vh-var(--header-height))]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav onMoreClick={() => setMobileMenuOpen(true)} />
    </div>
  );
}
