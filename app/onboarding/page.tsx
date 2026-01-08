"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { 
    Wallet, 
    Key, 
    ArrowRight, 
    ArrowLeft,
    Loader2, 
    Check, 
    Copy, 
    Eye, 
    EyeOff,
    Shield,
    Zap,
    DollarSign,
    AlertTriangle,
    Link2
} from "lucide-react";
import { isCrossmarkInstalled, connectCrossmark } from "@/lib/xrpl/crossmark";

type Step = "welcome" | "choice" | "create" | "import" | "crossmark" | "seed" | "fund" | "trustline" | "did" | "complete";

export default function OnboardingPage() {
    const router = useRouter();
    const { 
        createWallet, 
        importWalletFromSeed, 
        fundWallet, 
        setupTrustline,
        initializeDID,
        wallet,
        isFunded,
        hasTrustline,
        hasDID,
        refreshBalances,
        balances
    } = useWallet();

    const [step, setStep] = useState<Step>("welcome");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [seedPhrase, setSeedPhrase] = useState("");
    const [importSeed, setImportSeed] = useState("");
    const [showSeed, setShowSeed] = useState(false);
    const [seedCopied, setSeedCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [fundingError, setFundingError] = useState<string | null>(null);
    const [crossmarkInstalled, setCrossmarkInstalled] = useState(false);
    const [crossmarkAddress, setCrossmarkAddress] = useState<string | null>(null);

    // Check if Crossmark is installed
    useEffect(() => {
        // Need to check on client side after mount
        const checkCrossmark = () => {
            setCrossmarkInstalled(isCrossmarkInstalled());
        };
        // Check immediately and after a short delay (extension might load late)
        checkCrossmark();
        const timer = setTimeout(checkCrossmark, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Refresh balances when entering fund or trustline steps
    useEffect(() => {
        if ((step === "fund" || step === "trustline") && wallet) {
            refreshBalances();
        }
    }, [step, wallet, refreshBalances]);

    const handleCreateWallet = async () => {
        if (password.length < 6) {
            toast({ title: "Password too short", description: "Use at least 6 characters", variant: "destructive" });
            return;
        }
        if (password !== confirmPassword) {
            toast({ title: "Passwords don't match", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const { seed } = await createWallet(password);
            setSeedPhrase(seed);
            setStep("seed");
        } catch (error) {
            toast({ title: "Failed to create wallet", description: String(error), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleImportWallet = async () => {
        if (!importSeed.trim()) {
            toast({ title: "Enter seed phrase", variant: "destructive" });
            return;
        }
        if (password.length < 6) {
            toast({ title: "Password too short", description: "Use at least 6 characters", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            await importWalletFromSeed(importSeed.trim(), password);
            setStep("fund");
            toast({ title: "Wallet imported!", variant: "success" });
        } catch (error) {
            toast({ title: "Invalid seed phrase", description: String(error), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleConnectCrossmark = async () => {
        if (!crossmarkInstalled) {
            window.open("https://crossmark.io", "_blank");
            toast({ 
                title: "Install Crossmark", 
                description: "Please install the Crossmark browser extension and refresh", 
                variant: "destructive" 
            });
            return;
        }

        setLoading(true);
        try {
            const result = await connectCrossmark();
            if (result.success && result.address) {
                setCrossmarkAddress(result.address);
                setStep("crossmark");
                toast({ 
                    title: "Connected to Crossmark!", 
                    description: `Address: ${result.address.slice(0, 8)}...${result.address.slice(-6)}`,
                    variant: "success" 
                });
            } else {
                toast({ 
                    title: "Connection failed", 
                    description: result.error || "Could not connect to Crossmark", 
                    variant: "destructive" 
                });
            }
        } catch (error) {
            toast({ 
                title: "Connection failed", 
                description: String(error), 
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCopySeed = async () => {
        await navigator.clipboard.writeText(seedPhrase);
        setSeedCopied(true);
        setTimeout(() => setSeedCopied(false), 2000);
    };

    const handleFundWallet = async () => {
        setLoading(true);
        setFundingError(null);
        try {
            const success = await fundWallet();
            if (success) {
                await refreshBalances();
                toast({ title: "Wallet funded!", description: "You received test XRP", variant: "success" });
                // Auto-advance after short delay
                setTimeout(() => setStep("trustline"), 1000);
            } else {
                setFundingError("Faucet might be busy. Please try again.");
                toast({ title: "Funding failed", description: "Try again in a moment", variant: "destructive" });
            }
        } catch (error) {
            setFundingError(String(error));
            toast({ title: "Funding failed", description: String(error), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const [trustlineError, setTrustlineError] = useState<string | null>(null);

    const handleSetupTrustline = async () => {
        // Check if funded first
        if (!isFunded && parseFloat(balances.xrp) < 1) {
            toast({ 
                title: "Wallet not funded", 
                description: "You need XRP to pay for the trustline transaction. Go back and fund your wallet first.",
                variant: "destructive" 
            });
            return;
        }

        setLoading(true);
        setTrustlineError(null);
        try {
            const result = await setupTrustline();
            if (result.success) {
                setStep("did");
                toast({ title: "RLUSD enabled!", variant: "success" });
            } else {
                const errorMsg = result.error || "Trustline creation failed. You can skip this step for now.";
                setTrustlineError(errorMsg);
                toast({ 
                    title: "Trustline failed", 
                    description: errorMsg,
                    variant: "destructive" 
                });
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error";
            setTrustlineError(errorMsg);
            toast({ 
                title: "Trustline failed", 
                description: errorMsg,
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInitializeDID = async () => {
        setLoading(true);
        try {
            const success = await initializeDID();
            if (success) {
                setStep("complete");
                toast({ title: "Identity created!", variant: "success" });
            } else {
                toast({ title: "DID creation failed", description: "You can skip this and do it later", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "DID creation failed", description: "You can skip this and do it later", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = () => {
        router.push("/dashboard");
    };

    const xrpBalance = parseFloat(balances.xrp) || 0;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Welcome */}
                {step === "welcome" && (
                    <Card className="animate-fade-in">
                        <CardHeader className="text-center pb-2">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl font-bold text-white">Σ</span>
                            </div>
                            <CardTitle className="text-2xl">Welcome to SigmaPay</CardTitle>
                            <CardDescription>
                                Send money home instantly with near-zero fees
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Zap className="w-5 h-5 text-indigo-600" />
                                    <div>
                                        <p className="font-medium text-sm">Instant Transfers</p>
                                        <p className="text-xs text-slate-500">3-5 second settlement</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <p className="font-medium text-sm">Near-Zero Fees</p>
                                        <p className="text-xs text-slate-500">Less than $0.01 per transfer</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-sm">Verified & Secure</p>
                                        <p className="text-xs text-slate-500">DID-based identity verification</p>
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full" size="lg" onClick={() => setStep("choice")}>
                                Get Started
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Choice */}
                {step === "choice" && (
                    <Card className="animate-fade-in">
                        <CardHeader>
                            <CardTitle>Setup Wallet</CardTitle>
                            <CardDescription>Create a new wallet, import existing, or connect Crossmark</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Crossmark Connect - Featured option */}
                            <button
                                onClick={handleConnectCrossmark}
                                disabled={loading}
                                className="w-full p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/50 hover:border-emerald-400 hover:bg-emerald-100/50 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <Link2 className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">Connect Crossmark</p>
                                            <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">Recommended</span>
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            {crossmarkInstalled 
                                                ? "Use your Crossmark browser extension" 
                                                : "Install Crossmark extension first"}
                                        </p>
                                    </div>
                                    {loading && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
                                </div>
                            </button>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-500">or</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep("create")}
                                className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                        <Wallet className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Create New Wallet</p>
                                        <p className="text-sm text-slate-500">Generate a fresh wallet</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setStep("import")}
                                className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <Key className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Import Existing</p>
                                        <p className="text-sm text-slate-500">Use your seed phrase</p>
                                    </div>
                                </div>
                            </button>
                            <Button variant="ghost" className="w-full" onClick={() => setStep("welcome")}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Crossmark Connected */}
                {step === "crossmark" && (
                    <Card className="animate-fade-in">
                        <CardHeader className="text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4">
                                <Check className="w-10 h-10 text-white" />
                            </div>
                            <CardTitle>Crossmark Connected!</CardTitle>
                            <CardDescription>Your wallet is ready to use</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <p className="text-xs text-slate-500 mb-1">Connected Address</p>
                                <p className="font-mono text-sm text-slate-700 break-all">{crossmarkAddress}</p>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> Crossmark will prompt you to sign each transaction. 
                                    This keeps your keys secure in the extension.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-700">Next steps:</p>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">1</div>
                                        Get test RLUSD from <a href="https://tryrlusd.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">tryrlusd.com</a>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">2</div>
                                        Enable RLUSD trustline in Crossmark
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">3</div>
                                        Start sending payments!
                                    </li>
                                </ul>
                            </div>

                            <Button className="w-full" size="lg" onClick={() => router.push("/dashboard")}>
                                Go to Dashboard
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>

                            <Button variant="ghost" className="w-full" onClick={() => setStep("choice")}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Create Wallet */}
                {step === "create" && (
                    <Card className="animate-fade-in">
                        <CardHeader>
                            <CardTitle>Create Password</CardTitle>
                            <CardDescription>Secure your wallet with a password</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="At least 6 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                />
                            </div>
                            <Button 
                                className="w-full" 
                                onClick={handleCreateWallet}
                                disabled={loading || password.length < 6}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Create Wallet
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => setStep("choice")}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Import Wallet */}
                {step === "import" && (
                    <Card className="animate-fade-in">
                        <CardHeader>
                            <CardTitle>Import Wallet</CardTitle>
                            <CardDescription>Enter your seed phrase and create a password</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Seed Phrase</Label>
                                <Input
                                    value={importSeed}
                                    onChange={(e) => setImportSeed(e.target.value)}
                                    placeholder="sXXXXXXXXXXXXXXXXXX..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                />
                            </div>
                            <Button 
                                className="w-full" 
                                onClick={handleImportWallet}
                                disabled={loading || !importSeed.trim() || password.length < 6}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Import Wallet
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => setStep("choice")}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Seed Display */}
                {step === "seed" && (
                    <Card className="animate-fade-in">
                        <CardHeader>
                            <CardTitle className="text-amber-600">⚠️ Save Your Seed Phrase</CardTitle>
                            <CardDescription>
                                This is the ONLY way to recover your wallet. Write it down and store safely!
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-amber-800">Seed Phrase</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowSeed(!showSeed)} className="text-amber-600">
                                            {showSeed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button onClick={handleCopySeed} className="text-amber-600">
                                            {seedCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <code className="text-sm break-all font-mono text-amber-900">
                                    {showSeed ? seedPhrase : "••••••••••••••••••••"}
                                </code>
                            </div>
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                <strong>Never share</strong> your seed phrase. Anyone with it can access your funds.
                            </div>
                            <Button className="w-full" onClick={() => setStep("fund")}>
                                I&apos;ve Saved It
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Fund Wallet */}
                {step === "fund" && (
                    <Card className="animate-fade-in">
                        <CardHeader>
                            <CardTitle>Fund Your Wallet</CardTitle>
                            <CardDescription>Get test XRP from the faucet to start</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                                <Zap className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                                <p className="text-sm text-blue-800">
                                    You&apos;ll receive ~10 test XRP to cover transaction fees
                                </p>
                            </div>

                            {/* Show current balance */}
                            {xrpBalance > 0 && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                                    <p className="text-sm text-emerald-700">
                                        <Check className="w-4 h-4 inline mr-1" />
                                        Current balance: <strong>{xrpBalance.toFixed(2)} XRP</strong>
                                    </p>
                                </div>
                            )}

                            {fundingError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                                    {fundingError}
                                </div>
                            )}

                            <Button 
                                className="w-full" 
                                onClick={handleFundWallet}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                                {isFunded || xrpBalance > 0 ? "Fund More XRP" : "Fund Wallet"}
                            </Button>
                            
                            {(isFunded || xrpBalance > 0) && (
                                <Button className="w-full" variant="default" onClick={() => setStep("trustline")}>
                                    Continue to Enable RLUSD
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Setup Trustline */}
                {step === "trustline" && (
                    <Card className="animate-fade-in">
                        <CardHeader>
                            <CardTitle>Enable RLUSD</CardTitle>
                            <CardDescription>Set up your wallet to send and receive RLUSD stablecoin</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                                <DollarSign className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                                <p className="text-sm text-emerald-800">
                                    RLUSD is a USD-backed stablecoin. 1 RLUSD = 1 USD
                                </p>
                            </div>

                            {/* Show XRP balance warning if low */}
                            {xrpBalance < 1 && !hasTrustline && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                                    You need XRP to create the trustline. 
                                    <button 
                                        onClick={() => setStep("fund")} 
                                        className="underline ml-1 font-medium"
                                    >
                                        Go back to fund your wallet
                                    </button>
                                </div>
                            )}

                            {xrpBalance >= 1 && (
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 text-center">
                                    XRP Balance: <strong>{xrpBalance.toFixed(2)} XRP</strong> ✓
                                </div>
                            )}

                            {/* Show trustline error if any */}
                            {trustlineError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                                    {trustlineError}
                                </div>
                            )}

                            <Button 
                                className="w-full" 
                                onClick={handleSetupTrustline}
                                disabled={loading || hasTrustline || xrpBalance < 1}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {hasTrustline ? "Already Enabled ✓" : "Enable RLUSD"}
                            </Button>

                            {hasTrustline && (
                                <Button className="w-full" variant="default" onClick={() => setStep("did")}>
                                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}

                            {/* Skip option - always available for testnet issues */}
                            <Button variant="outline" className="w-full" onClick={() => setStep("did")}>
                                Skip for now (can enable later)
                            </Button>

                            <Button variant="ghost" className="w-full" onClick={() => setStep("fund")}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Fund
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Initialize DID */}
                {step === "did" && (
                    <Card className="animate-fade-in">
                        <CardHeader>
                            <CardTitle>Create Your Identity</CardTitle>
                            <CardDescription>Set up on-chain decentralized identity for verified transfers</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                                <Shield className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                                <p className="text-sm text-indigo-800">
                                    Your DID enables verification for higher transfer limits
                                </p>
                            </div>
                            <Button 
                                className="w-full" 
                                onClick={handleInitializeDID}
                                disabled={loading || hasDID}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {hasDID ? "Already Created ✓" : "Create Identity"}
                            </Button>
                            {hasDID && (
                                <Button className="w-full" variant="default" onClick={() => setStep("complete")}>
                                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                            <Button variant="ghost" className="w-full" onClick={() => setStep("complete")}>
                                Skip for now
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Complete */}
                {step === "complete" && (
                    <Card className="animate-fade-in">
                        <CardHeader className="text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4">
                                <Check className="w-10 h-10 text-white" />
                            </div>
                            <CardTitle>You&apos;re All Set! 🎉</CardTitle>
                            <CardDescription>Your wallet is ready to send and receive RLUSD</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full" size="lg" onClick={handleComplete}>
                                Go to Dashboard
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
