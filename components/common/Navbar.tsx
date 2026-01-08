"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import { VerificationBadge } from "@/components/did/VerificationBadge";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/utils/format";
import {
    Home,
    Send,
    Inbox,
    Clock,
    LogOut,
    Wallet,
    Menu,
    X,
    Shield,
    Briefcase
} from "lucide-react";
import { useState } from "react";

const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/send", label: "Send", icon: Send },
    { href: "/receive", label: "Receive", icon: Inbox },
    { href: "/rwa", label: "RWA", icon: Briefcase },
    { href: "/history", label: "History", icon: Clock },
];

export function Navbar() {
    const pathname = usePathname();
    const { address, wallet, logout, verificationLevel } = useWallet();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Don't show navbar on landing page, onboarding, or if not logged in
    if (pathname === "/" || pathname === "/onboarding" || !wallet) {
        return null;
    }

    return (
        <>
            {/* Desktop Navbar */}
            <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
                <div className="max-w-6xl mx-auto w-full px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">Σ</span>
                        </div>
                        <span className="font-bold text-xl text-slate-900">SigmaPay</span>
                    </Link>

                    <div className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant={isActive ? "secondary" : "ghost"}
                                        size="sm"
                                        className={isActive ? "bg-slate-100" : ""}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {item.label}
                                    </Button>
                                </Link>
                            );
                        })}
                        <Link href="/verify">
                            <Button
                                variant={pathname === "/verify" ? "secondary" : "ghost"}
                                size="sm"
                            >
                                <Shield className="w-4 h-4 mr-2" />
                                Verify
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <VerificationBadge level={verificationLevel} size="sm" />
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                            <Wallet className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-mono text-slate-600">
                                {formatAddress(address || "", 4)}
                            </span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={logout}>
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 pb-safe">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? "text-indigo-600" : "text-slate-400"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-xs mt-1">{item.label}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="flex flex-col items-center justify-center flex-1 h-full text-slate-400"
                    >
                        <Menu className="w-5 h-5" />
                        <span className="text-xs mt-1">More</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Sheet */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60]">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold text-lg">Menu</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="mb-4">
                            <VerificationBadge level={verificationLevel} />
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl mb-4">
                            <p className="text-xs text-slate-500 mb-1">Wallet Address</p>
                            <p className="text-sm font-mono text-slate-700 truncate">{address}</p>
                        </div>

                        <Link href="/rwa" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="outline" className="w-full mb-2">
                                <Briefcase className="w-4 h-4 mr-2" />
                                RWA Marketplace
                            </Button>
                        </Link>

                        <Link href="/verify" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="outline" className="w-full mb-4">
                                <Shield className="w-4 h-4 mr-2" />
                                Verify Identity
                            </Button>
                        </Link>

                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => {
                                logout();
                                setMobileMenuOpen(false);
                            }}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            )}

            {/* Spacer for fixed navbars */}
            <div className="hidden md:block h-16" />
        </>
    );
}
