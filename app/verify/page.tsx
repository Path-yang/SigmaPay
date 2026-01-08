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
    Check, 
    ArrowRight,
    Loader2,
    Zap
} from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
    const router = useRouter();
    const { verificationLevel, verifyIdentity } = useWallet();
    
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

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
                    description: "You can now tokenize assets and send up to $1,000 via direct payments",
                });
                setTimeout(() => {
                    router.push("/tokenize");
                }, 2000);
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
                    description: "You can now tokenize assets and have unlimited transfer limits",
                });
                setTimeout(() => {
                    router.push("/tokenize");
                }, 2000);
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
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Current Status */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Current Status</CardTitle>
                        <VerificationBadge level={verificationLevel} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-xl">
                            <p className="text-sm text-muted-foreground mb-1">Send Limit</p>
                            <p className="text-xl font-bold text-foreground">{getLimitDisplay(verificationLevel)}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-xl">
                            <p className="text-sm text-muted-foreground mb-1">Transfer Method</p>
                            <p className="text-xl font-bold text-foreground">{VERIFICATION_BENEFITS[verificationLevel].method}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isFullyVerified ? (
                /* Fully Verified */
                <Card className="border-success/30 bg-success/5">
                    <CardContent className="p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="w-10 h-10 text-success" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Fully Verified!</h2>
                        <p className="text-muted-foreground mb-6">
                            You have access to all features including unlimited transfers and instant settlement.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link href="/tokenize">
                                <Button>
                                    Tokenize Assets
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                            <Link href="/send">
                                <Button variant="outline">
                                    Send a Gift
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* Verification Form */
                <>
                    {/* Verification Tiers */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card className={`border-2 ${verificationLevel === VerificationLevel.BASIC ? "border-info/50 bg-info/5" : "border-border"}`}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-info" />
                                    <CardTitle className="text-lg">Basic</CardTitle>
                                    {verificationLevel === VerificationLevel.BASIC && (
                                        <span className="px-2 py-0.5 bg-info/10 text-info text-xs rounded-full">Current</span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-foreground mb-2">$1,000</p>
                                <p className="text-sm text-muted-foreground mb-3">per transaction</p>
                                <ul className="space-y-2">
                                    {VERIFICATION_BENEFITS[VerificationLevel.BASIC].features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Check className="w-4 h-4 text-info" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-success/30 bg-success/5">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-success" />
                                    <CardTitle className="text-lg">Full</CardTitle>
                                    <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">Recommended</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-foreground mb-2">Unlimited</p>
                                <p className="text-sm text-muted-foreground mb-3">no limits</p>
                                <ul className="space-y-2">
                                    {VERIFICATION_BENEFITS[VerificationLevel.VERIFIED].features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Check className="w-4 h-4 text-success" />
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
                                    Phone Number <span className="text-muted-foreground">(required for full verification)</span>
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
                                        <p className="text-xs text-muted-foreground">$1,000 limit</p>
                                    </div>
                                </Button>
                                <Button
                                    onClick={handleFullVerify}
                                    disabled={loading || !name || !email || !phone}
                                    className="h-auto py-3"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                    <div className="text-left">
                                        <p className="font-semibold">Full Verify</p>
                                        <p className="text-xs opacity-80">Unlimited</p>
                                    </div>
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground text-center pt-2">
                                <Zap className="w-3 h-3 inline mr-1" />
                                Verification is stored on-chain using XRPL DID
                            </p>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
