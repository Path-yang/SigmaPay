"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerificationBadge } from "@/components/did/VerificationBadge";
import { VerificationLevel, VERIFICATION_BENEFITS, getLimitDisplay } from "@/lib/xrpl/constants";
import { toast } from "@/components/ui/use-toast";
import { 
    Shield, 
    ShieldCheck, 
    ShieldAlert,
    Check, 
    ArrowLeft, 
    ArrowRight,
    Loader2,
    Zap
} from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
    const router = useRouter();
    const { wallet, verificationLevel, verifyIdentity, isLoading, hasWallet } = useWallet();
    
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    // Redirect if no wallet
    if (!hasWallet) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <ShieldAlert className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">No Wallet Found</h2>
                        <p className="text-slate-500 mb-6">Create a wallet first to verify your identity</p>
                        <Link href="/onboarding">
                            <Button>Create Wallet</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!wallet) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Wallet Locked</h2>
                        <p className="text-slate-500 mb-6">Unlock your wallet to verify your identity</p>
                        <Link href="/dashboard">
                            <Button>Go to Dashboard</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleBasicVerify = async () => {
        if (!name || !email) {
            toast({ title: "Please fill in all required fields", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const success = await verifyIdentity(VerificationLevel.BASIC, { name, email });
            if (success) {
                toast({ 
                    title: "Basic Verification Complete! 🎉", 
                    description: "You can now send up to $1,000 via direct payments",
                    variant: "success" 
                });
            } else {
                toast({ 
                    title: "Verification Failed", 
                    description: "The XRPL testnet may be slow. Please wait a moment and try again.",
                    variant: "destructive" 
                });
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred";
            const isTimeout = errorMsg.includes("timed out") || errorMsg.includes("timeout");
            toast({ 
                title: isTimeout ? "Network Timeout" : "Verification Error", 
                description: isTimeout ? "The testnet is slow. Please try again in a few moments." : errorMsg,
                variant: "destructive" 
            });
            console.error("Verification error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFullVerify = async () => {
        if (!name || !email || !phone) {
            toast({ title: "Please fill in all fields including phone", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const success = await verifyIdentity(VerificationLevel.VERIFIED, { name, email, phone });
            if (success) {
                toast({ 
                    title: "Full Verification Complete! 🎉", 
                    description: "You now have unlimited transfer limits",
                    variant: "success" 
                });
            } else {
                toast({ 
                    title: "Verification Failed", 
                    description: "The XRPL testnet may be slow. Please wait a moment and try again.",
                    variant: "destructive" 
                });
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred";
            const isTimeout = errorMsg.includes("timed out") || errorMsg.includes("timeout");
            toast({ 
                title: isTimeout ? "Network Timeout" : "Verification Error", 
                description: isTimeout ? "The testnet is slow. Please try again in a few moments." : errorMsg,
                variant: "destructive" 
            });
            console.error("Verification error:", error);
        } finally {
            setLoading(false);
        }
    };

    const isFullyVerified = verificationLevel === VerificationLevel.VERIFIED;

    return (
        <div className="min-h-screen pb-24 md:pb-8">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Verify Identity</h1>
                        <p className="text-slate-500">Unlock higher limits and instant transfers</p>
                    </div>
                </div>

                {/* Current Status */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Current Status</CardTitle>
                            <VerificationBadge level={verificationLevel} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-sm text-slate-500 mb-1">Send Limit</p>
                                <p className="text-xl font-bold">{getLimitDisplay(verificationLevel)}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-sm text-slate-500 mb-1">Transfer Method</p>
                                <p className="text-xl font-bold">{VERIFICATION_BENEFITS[verificationLevel].method}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {isFullyVerified ? (
                    /* Fully Verified */
                    <Card className="border-emerald-200 bg-emerald-50">
                        <CardContent className="p-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-emerald-800 mb-2">Fully Verified!</h2>
                            <p className="text-emerald-700 mb-6">
                                You have access to all features including unlimited transfers and instant settlement.
                            </p>
                            <Link href="/send">
                                <Button className="bg-emerald-600 hover:bg-emerald-700">
                                    Send a Gift
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    /* Verification Form */
                    <>
                        {/* Verification Tiers */}
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <Card className={`border-2 ${verificationLevel === VerificationLevel.BASIC ? "border-blue-300 bg-blue-50/50" : "border-slate-200"}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                        <CardTitle className="text-lg text-blue-800">Basic</CardTitle>
                                        {verificationLevel === VerificationLevel.BASIC && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Current</span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold text-slate-900 mb-2">$1,000</p>
                                    <p className="text-sm text-slate-500 mb-3">per transaction</p>
                                    <ul className="space-y-2">
                                        {VERIFICATION_BENEFITS[VerificationLevel.BASIC].features.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                <Check className="w-4 h-4 text-blue-500" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-emerald-200 bg-emerald-50/50">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                        <CardTitle className="text-lg text-emerald-800">Full</CardTitle>
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">Recommended</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold text-slate-900 mb-2">Unlimited</p>
                                    <p className="text-sm text-slate-500 mb-3">no limits</p>
                                    <ul className="space-y-2">
                                        {VERIFICATION_BENEFITS[VerificationLevel.VERIFIED].features.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Verification Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Complete Verification</CardTitle>
                                <CardDescription>
                                    Fill in your details to verify your identity on-chain
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your full name"
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        Phone Number <span className="text-slate-400">(required for full verification)</span>
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+65 1234 5678"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={handleBasicVerify}
                                        disabled={loading || !name || !email || verificationLevel !== VerificationLevel.UNVERIFIED}
                                        className="h-auto py-3"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                                        <div className="text-left">
                                            <p className="font-semibold">Basic Verify</p>
                                            <p className="text-xs text-slate-500">$1,000 limit</p>
                                        </div>
                                    </Button>
                                    <Button
                                        onClick={handleFullVerify}
                                        disabled={loading || !name || !email || !phone}
                                        className="h-auto py-3 bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                        <div className="text-left">
                                            <p className="font-semibold">Full Verify</p>
                                            <p className="text-xs text-emerald-200">Unlimited</p>
                                        </div>
                                    </Button>
                                </div>

                                <p className="text-xs text-slate-500 text-center pt-2">
                                    <Zap className="w-3 h-3 inline mr-1" />
                                    Verification is stored on-chain using XRPL DID
                                </p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}

