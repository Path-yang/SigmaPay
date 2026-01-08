"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Globe, ShieldCheck, DollarSign } from "lucide-react";

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-2/5" />

            {/* Animated background shapes */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-chart-2/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-chart-4/5 rounded-full blur-3xl" />
            </div>

            {/* Grid pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-30" />

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-full text-sm font-medium text-muted-foreground mb-8 shadow-card">
                    <Zap className="w-4 h-4 text-primary" />
                    Powered by XRP Ledger
                    <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full ml-2">
                        + DID Verification
                    </span>
                </div>

                {/* Main heading */}
                <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                    Send money home
                    <br />
                    <span className="text-primary">
                        instantly & verified
                    </span>
                </h1>

                {/* Subheading */}
                <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                    Cross-border remittance made simple. Send RLUSD anywhere with near-zero fees and on-chain identity verification.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <Link href="/onboarding">
                        <Button size="lg" className="text-lg px-8 h-14 shadow-lg">
                            Get Started
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                            I have a wallet
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-12">
                    <div className="p-4 bg-card/70 backdrop-blur rounded-xl border border-border">
                        <p className="text-2xl font-bold text-foreground">3-5s</p>
                        <p className="text-sm text-muted-foreground">Settlement</p>
                    </div>
                    <div className="p-4 bg-card/70 backdrop-blur rounded-xl border border-border">
                        <p className="text-2xl font-bold text-foreground">&lt;$0.01</p>
                        <p className="text-sm text-muted-foreground">Per Transfer</p>
                    </div>
                    <div className="p-4 bg-card/70 backdrop-blur rounded-xl border border-border">
                        <p className="text-2xl font-bold text-foreground">24/7</p>
                        <p className="text-sm text-muted-foreground">Available</p>
                    </div>
                </div>

                {/* Feature cards */}
                <div className="grid md:grid-cols-4 gap-6 mt-12">
                    <div className="p-6 bg-card/70 backdrop-blur-xl rounded-2xl border border-border shadow-card card-hover">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 mx-auto">
                            <Zap className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Instant Transfers</h3>
                        <p className="text-muted-foreground text-sm">
                            3-5 second settlement on XRPL
                        </p>
                    </div>

                    <div className="p-6 bg-card/70 backdrop-blur-xl rounded-2xl border border-border shadow-card card-hover">
                        <div className="w-12 h-12 rounded-xl bg-chart-2 flex items-center justify-center mb-4 mx-auto">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">RLUSD Stablecoin</h3>
                        <p className="text-muted-foreground text-sm">
                            USD-backed, no volatility
                        </p>
                    </div>

                    <div className="p-6 bg-card/70 backdrop-blur-xl rounded-2xl border border-border shadow-card card-hover">
                        <div className="w-12 h-12 rounded-xl bg-info flex items-center justify-center mb-4 mx-auto">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">DID Verified</h3>
                        <p className="text-muted-foreground text-sm">
                            On-chain identity for trust
                        </p>
                    </div>

                    <div className="p-6 bg-card/70 backdrop-blur-xl rounded-2xl border border-border shadow-card card-hover">
                        <div className="w-12 h-12 rounded-xl bg-chart-5 flex items-center justify-center mb-4 mx-auto">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Global Reach</h3>
                        <p className="text-muted-foreground text-sm">
                            Send anywhere, no borders
                        </p>
                    </div>
                </div>

                {/* Trust badge */}
                <div className="mt-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Built on XRPL • 12+ years of reliability • Eco-friendly</span>
                </div>
            </div>
        </section>
    );
}
