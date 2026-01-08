"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import {
  LayoutDashboard,
  Send,
  Inbox,
  Clock,
  Shield,
  Briefcase,
  Lock,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils/format";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/send", label: "Send", icon: Send },
  { href: "/receive", label: "Receive", icon: Inbox },
  { href: "/escrow", label: "Escrow", icon: Lock },
  { href: "/rwa", label: "RWA", icon: Briefcase },
  { href: "/history", label: "History", icon: Clock },
];

const secondaryNavItems: NavItem[] = [
  { href: "/verify", label: "Verify ID", icon: Shield },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useWallet();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-sidebar bg-card border-r border-border shadow-sidebar flex flex-col",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-header px-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-lg">Σ</span>
          </div>
          <span className="font-bold text-xl text-foreground">SigmaPay</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-item", isActive && "active")}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-4 border-t border-border" />

        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-item", isActive && "active")}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={logout}
          className="sidebar-item w-full text-left"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
          <span>Log out</span>
        </button>
      </nav>
    </aside>
  );
}

// Mobile sidebar overlay
interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { logout } = useWallet();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-50 h-screen w-72 bg-card border-r border-border shadow-xl flex flex-col lg:hidden animate-slide-in">
        {/* Logo */}
        <div className="flex items-center justify-between h-header px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">Σ</span>
            </div>
            <span className="font-bold text-xl text-foreground">SigmaPay</span>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn("sidebar-item", isActive && "active")}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="my-4 border-t border-border" />

          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn("sidebar-item", isActive && "active")}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="sidebar-item w-full text-left"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
            <span>Log out</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
