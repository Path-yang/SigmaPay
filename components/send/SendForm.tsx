"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/components/wallet/WalletProvider";
import { smartSend } from "@/lib/xrpl/payments";
import { getWalletFromSeed } from "@/lib/xrpl/wallet";
import { isValidXRPLAddress, formatAmount } from "@/lib/utils/format";
import { getExplorerTxLink, getLimitDisplay, RLUSD_CURRENCY_DISPLAY } from "@/lib/xrpl/constants";
import { VerificationBadge } from "@/components/did/VerificationBadge";
import { LimitWarning } from "@/components/did/LimitWarning";
import { toast } from "@/components/ui/use-toast";
import {
    Send,
    Loader2,
    CheckCircle2,
    ArrowRight,
    DollarSign,
    User,
    MessageSquare,
    ExternalLink,
    Gift,
    AlertTriangle,
    RefreshCw
} from "lucide-react";
import Link from "next/link";

type Step = "amount" | "recipient" | "message" | "confirm" | "success";

interface TransactionResult {
    hash: string;
    method: "direct" | "check";
}

export function SendForm() {
    const { wallet, balances, refreshBalances, verificationLevel, sendLimit, isVerified, hasTrustline } = useWallet();

    const [step, setStep] = useState<Step>("amount");
    const [amount, setAmount] = useState("");
    const [recipient, setRecipient] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<TransactionResult | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(true);
    const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);

    // Refresh wallet state when component mounts
    useEffect(() => {
        let mounted = true;
        
        const refresh = async () => {
            if (!mounted) return;
            setIsRefreshing(true);
            try {
                await refreshBalances();
            } catch (e) {
                console.error("Failed to refresh:", e);
            } finally {
                if (mounted) {
                    setIsRefreshing(false);
                }
            }
        };
        
        const timer = setTimeout(refresh, 500);
        
        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, []);

    const amountNum = parseFloat(amount) || 0;
    const rlusdBalance = parseFloat(balances.rlusd) || 0;
    const hasEnoughBalance = amountNum > 0 && amountNum <= rlusdBalance;
    const isOverLimit = amountNum > sendLimit;
    const willUseCheck = !isVerified && amountNum <= sendLimit;

    const handleNext = () => {
        switch (step) {
            case "amount":
                if (!hasEnoughBalance) {
                    toast({
                        title: "Invalid amount",
                        description: amountNum > rlusdBalance
                            ? "Insufficient RLUSD balance"
                            : "Please enter a valid amount",
                        variant: "destructive",
                    });
                    return;
                }
                if (isOverLimit) {
                    toast({
                        title: "Amount exceeds limit",
                        description: `Your verification level allows up to ${getLimitDisplay(verificationLevel)}`,
                        variant: "destructive",
                    });
                    return;
                }
                setStep("recipient");
                break;
            case "recipient":
                if (!isValidXRPLAddress(recipient)) {
                    toast({
                        title: "Invalid address",
                        description: "Please enter a valid XRPL address",
                        variant: "destructive",
                    });
                    return;
                }
                setStep("message");
                break;
            case "message":
                setStep("confirm");
                break;
        }
    };

    const handleBack = () => {
        switch (step) {
            case "recipient":
                setStep("amount");
                break;
            case "message":
                setStep("recipient");
                break;
            case "confirm":
                setStep("message");
                break;
        }
    };

    const handleSend = async () => {
        if (!wallet) return;

        setIsLoading(true);

        try {
            const xrplWallet = getWalletFromSeed(wallet.seed!);

            const txResult = await smartSend({
                wallet: xrplWallet,
                destination: recipient,
                amount,
                memo: message || undefined,
            });

            if (txResult.success && txResult.hash) {
                setResult({
                    hash: txResult.hash,
                    method: txResult.method,
                });
                setStep("success");
                await refreshBalances();

                toast({
                    title: txResult.method === "check" ? "Check created!" : "Payment sent!",
                    description: `${formatAmount(amount)} ${RLUSD_CURRENCY_DISPLAY} ${txResult.method === "check" ? "check created" : "sent"} successfully`,
                    variant: "success",
                });
            } else {
                throw new Error(txResult.error || "Transaction failed");
            }
        } catch (err) {
            toast({
                title: "Transaction failed",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setStep("amount");
        setAmount("");
        setRecipient("");
        setMessage("");
        setResult(null);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshBalances();
            toast({ title: "Status refreshed", variant: "success" });
        } finally {
            setIsRefreshing(false);
        }
    };

    // Show loading while checking status
    if (isRefreshing) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-500">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    // Show trustline setup prompt if not enabled
    if (!hasTrustline) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">RLUSD Not Enabled</h3>
                    <p className="text-slate-500 mb-4">
                        You need to enable RLUSD in your wallet before you can send payments.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Link href="/onboarding">
                            <Button>
                                Enable RLUSD
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Success step
    if (step === "success" && result) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {result.method === "check" ? "Check Created!" : "Payment Sent!"}
                    </h2>
                    <p className="text-slate-500 mb-2">
                        {formatAmount(amount)} {RLUSD_CURRENCY_DISPLAY} {result.method === "check" ? "check created for" : "sent to"} the recipient
                    </p>

                    {result.method === "check" && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-sm text-amber-700">
                            <AlertTriangle className="w-4 h-4 inline mr-2" />
                            The recipient needs to claim this check to receive the funds.
                        </div>
                    )}

                    <div className="p-4 bg-slate-50 rounded-xl mb-6">
                        <p className="text-xs text-slate-500 mb-1">Transaction Hash</p>
                        <p className="text-sm font-mono text-slate-700 break-all">{result.hash}</p>
                    </div>

                    <div className="flex gap-3">
                        <a
                            href={getExplorerTxLink(result.hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                        >
                            <Button variant="outline" className="w-full">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View on Explorer
                            </Button>
                        </a>
                        <Button className="flex-1" onClick={handleReset}>
                            <Send className="w-4 h-4 mr-2" />
                            Send Another
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5" />
                        <CardTitle>Send Gift</CardTitle>
                    </div>
                    <VerificationBadge level={verificationLevel} size="sm" />
                </div>
                <CardDescription>
                    Send {RLUSD_CURRENCY_DISPLAY} to anyone with an XRPL wallet
                    <span className="block text-xs mt-1">
                        Your limit: {getLimitDisplay(verificationLevel)}
                        {!isVerified && " • Sent as claimable check"}
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Progress indicator */}
                <div className="flex items-center gap-2 mb-6">
                    {["amount", "recipient", "message", "confirm"].map((s, i) => (
                        <div key={s} className="flex items-center flex-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step === s
                                        ? "bg-indigo-600 text-white"
                                        : ["amount", "recipient", "message", "confirm"].indexOf(step) > i
                                            ? "bg-emerald-500 text-white"
                                            : "bg-slate-100 text-slate-400"
                                    }`}
                            >
                                {["amount", "recipient", "message", "confirm"].indexOf(step) > i ? "✓" : i + 1}
                            </div>
                            {i < 3 && (
                                <div
                                    className={`flex-1 h-1 mx-2 rounded ${["amount", "recipient", "message", "confirm"].indexOf(step) > i
                                            ? "bg-emerald-500"
                                            : "bg-slate-100"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Amount Step */}
                {step === "amount" && (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <p className="text-sm text-slate-500 mb-2">Available {RLUSD_CURRENCY_DISPLAY} Balance</p>
                            <p className="text-3xl font-bold text-slate-900">
                                ${formatAmount(balances.rlusd)} <span className="text-lg text-slate-500">{RLUSD_CURRENCY_DISPLAY}</span>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount ({RLUSD_CURRENCY_DISPLAY})</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-11 text-xl h-14"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>

                        {amountNum > 0 && isOverLimit && (
                            <LimitWarning
                                amount={amountNum}
                                verificationLevel={verificationLevel}
                                onVerifyClick={() => setShowVerifyPrompt(true)}
                            />
                        )}

                        {willUseCheck && amountNum > 0 && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                                <AlertTriangle className="w-4 h-4 inline mr-2" />
                                This will be sent as a <strong>claimable check</strong>. 
                                <Link href="/verify" className="underline ml-1">Verify your identity</Link> for instant direct payments.
                            </div>
                        )}

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleNext}
                            disabled={!hasEnoughBalance || isOverLimit}
                        >
                            Continue
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {/* Recipient Step */}
                {step === "recipient" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="recipient">Recipient Address</Label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    id="recipient"
                                    placeholder="rXXXX..."
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="pl-11"
                                />
                            </div>
                        </div>

                        {willUseCheck && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-blue-800">Sending as Claimable Check</p>
                                        <p className="text-sm text-blue-700">
                                            The recipient will need to claim this check to receive the funds.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleBack} className="flex-1">
                                Back
                            </Button>
                            <Button onClick={handleNext} className="flex-1">
                                Continue
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Message Step */}
                {step === "message" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="message">Personal Message (Optional)</Label>
                            <div className="relative">
                                <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                                <Textarea
                                    id="message"
                                    placeholder="Add a personal note to your gift..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="pl-11 min-h-[120px]"
                                    maxLength={200}
                                />
                            </div>
                            <p className="text-xs text-slate-500 text-right">{message.length}/200</p>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleBack} className="flex-1">
                                Back
                            </Button>
                            <Button onClick={handleNext} className="flex-1">
                                Review
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Confirm Step */}
                {step === "confirm" && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Amount</span>
                                <span className="font-semibold">${formatAmount(amount)} {RLUSD_CURRENCY_DISPLAY}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Recipient</span>
                                <span className="font-mono text-sm">
                                    {recipient.slice(0, 8)}...{recipient.slice(-6)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Method</span>
                                <span className={`font-semibold ${willUseCheck ? "text-amber-600" : "text-emerald-600"}`}>
                                    {willUseCheck ? "Claimable Check" : "Direct Payment"}
                                </span>
                            </div>
                            {message && (
                                <div className="pt-3 border-t border-slate-200">
                                    <p className="text-slate-500 text-sm mb-1">Message:</p>
                                    <p className="text-slate-700">&quot;{message}&quot;</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <p className="text-sm text-indigo-700">
                                <strong>Network Fee:</strong> ~0.00001 XRP (negligible)
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleBack} className="flex-1">
                                Back
                            </Button>
                            <Button
                                onClick={handleSend}
                                className="flex-1"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {willUseCheck ? "Creating..." : "Sending..."}
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        {willUseCheck ? "Create Check" : "Send Now"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
