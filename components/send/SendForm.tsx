"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/components/wallet/WalletProvider";
import { sendXRPPayment } from "@/lib/xrpl/payments";
import { getWalletFromSeed } from "@/lib/xrpl/wallet";
import { isValidXRPLAddress, formatAmount } from "@/lib/utils/format";
import { getExplorerTxLink } from "@/lib/xrpl/constants";
import { VerificationBadge } from "@/components/did/VerificationBadge";
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
    Gift
} from "lucide-react";
import Link from "next/link";

type Step = "amount" | "recipient" | "message" | "confirm" | "success";

interface TransactionResult {
    hash: string;
    method: "direct" | "check";
}

export function SendForm() {
    const { wallet, balances, refreshBalances, verificationLevel } = useWallet();

    const [step, setStep] = useState<Step>("amount");
    const [amount, setAmount] = useState("");
    const [recipient, setRecipient] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<TransactionResult | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(true);

    // Refresh wallet state when component mounts to ensure trustline status is current
    useEffect(() => {
        let mounted = true;
        
        const refresh = async () => {
            if (!mounted) return;
            setIsRefreshing(true);
            try {
                console.log("SendForm: Refreshing balances...");
                await refreshBalances();
                console.log("SendForm: Refresh complete, hasTrustline will update");
            } catch (e) {
                console.error("Failed to refresh:", e);
            } finally {
                if (mounted) {
                    setIsRefreshing(false);
                }
            }
        };
        
        // Small delay to ensure wallet is connected
        const timer = setTimeout(refresh, 500);
        
        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, []);

    const amountNum = parseFloat(amount) || 0;
    // Use XRP balance since RLUSD testnet issuer is not available
    const balanceNum = parseFloat(balances.xrp) || 0;
    // Reserve 10 XRP for account reserve
    const availableBalance = Math.max(0, balanceNum - 10);
    const hasEnoughBalance = amountNum > 0 && amountNum <= availableBalance;

    const handleNext = () => {
        switch (step) {
            case "amount":
                if (!hasEnoughBalance) {
                    toast({
                        title: "Invalid amount",
                        description: amountNum > availableBalance
                            ? "Insufficient XRP balance"
                            : "Please enter a valid amount",
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

            const txResult = await sendXRPPayment({
                wallet: xrplWallet,
                destination: recipient,
                amount,
                memo: message || undefined,
            });

            if (txResult.success && txResult.hash) {
                setResult({
                    hash: txResult.hash,
                    method: "direct",
                });
                setStep("success");
                await refreshBalances();

                toast({
                    title: "Payment sent!",
                    description: `${formatAmount(amount)} XRP sent successfully`,
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

    // NOTE: Removed RLUSD trustline check - testnet issuer address was invalid
    // Users can now send with XRP balance

    // Success step
    if (step === "success" && result) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Payment Sent!
                    </h2>
                    <p className="text-slate-500 mb-2">
                        {formatAmount(amount)} XRP sent to the recipient
                    </p>

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
                    Send XRP to anyone with an XRPL wallet
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
                            <p className="text-sm text-slate-500 mb-2">Available Balance</p>
                            <p className="text-3xl font-bold text-slate-900">
                                {formatAmount(availableBalance.toString())} <span className="text-lg text-slate-500">XRP</span>
                            </p>
                            <p className="text-xs text-slate-400">({formatAmount(balances.xrp)} XRP total, 10 XRP reserved)</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (XRP)</Label>
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
                            <p className="text-xs text-slate-500">Sending XRP on testnet</p>
                        </div>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleNext}
                            disabled={!hasEnoughBalance}
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
                                <span className="font-semibold">{formatAmount(amount)} XRP</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Recipient</span>
                                <span className="font-mono text-sm">
                                    {recipient.slice(0, 8)}...{recipient.slice(-6)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Method</span>
                                <span className="font-semibold text-emerald-600">
                                    Direct Payment
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
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Now
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
