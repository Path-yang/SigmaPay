"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/components/wallet/WalletProvider";
import { getIncomingChecks, cashCheck, decodeMemo, CheckObject } from "@/lib/xrpl/checks";
import { getWalletFromSeed } from "@/lib/xrpl/wallet";
import { formatAddress, formatAmount } from "@/lib/utils/format";
import { getExplorerTxLink } from "@/lib/xrpl/constants";
import { toast } from "@/components/ui/use-toast";
import {
    Inbox,
    Loader2,
    CheckCircle2,
    DollarSign,
    User,
    MessageSquare,
    ExternalLink,
    RefreshCw
} from "lucide-react";
import Link from "next/link";

interface CheckDisplay {
    index: string;
    sender: string;
    amount: string;
    memo?: string;
}

export function ChecksList() {
    const { address, wallet, hasTrustline, refreshBalances } = useWallet();

    const [checks, setChecks] = useState<CheckDisplay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<string | null>(null);

    const loadChecks = useCallback(async () => {
        if (!address) return;

        setIsLoading(true);
        try {
            const incomingChecks = await getIncomingChecks(address);

            const checkDisplays: CheckDisplay[] = incomingChecks.map((check: CheckObject) => {
                let amount = "0";
                if (typeof check.SendMax === "object" && check.SendMax.value) {
                    amount = check.SendMax.value;
                }

                let memo: string | undefined;
                if (check.Memos?.[0]?.Memo?.MemoData) {
                    memo = decodeMemo(check.Memos[0].Memo.MemoData);
                }

                return {
                    index: check.index,
                    sender: check.Account,
                    amount,
                    memo,
                };
            });

            setChecks(checkDisplays);
        } catch (err) {
            console.error("Failed to load checks:", err);
            toast({
                title: "Failed to load checks",
                description: "Please try again",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        loadChecks();
    }, [loadChecks]);

    const handleCashCheck = async (check: CheckDisplay) => {
        if (!wallet) return;

        setClaimingId(check.index);

        try {
            const xrplWallet = getWalletFromSeed(wallet.seed!);
            const result = await cashCheck(xrplWallet, check.index, check.amount);

            if (result.success) {
                toast({
                    title: "Check claimed!",
                    description: `${formatAmount(check.amount)} RLUSD has been added to your wallet`,
                    variant: "success",
                });

                await refreshBalances();
                await loadChecks();
            } else {
                throw new Error(result.error || "Failed to cash check");
            }
        } catch (err) {
            toast({
                title: "Failed to claim check",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        } finally {
            setClaimingId(null);
        }
    };

    if (!hasTrustline) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">RLUSD Not Enabled</h3>
                    <p className="text-slate-500 mb-4">
                        Enable RLUSD on your wallet to receive and claim checks.
                    </p>
                    <Link href="/dashboard">
                        <Button>Go to Dashboard</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Inbox className="w-5 h-5" />
                            Pending Checks
                        </CardTitle>
                        <CardDescription>
                            Checks waiting for you to claim
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadChecks}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="p-4 border rounded-xl">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-full" />
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-24 mb-2" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-10 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : checks.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Inbox className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">No Pending Checks</h3>
                        <p className="text-slate-500 text-sm">
                            When someone sends you a check, it will appear here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {checks.map((check) => (
                            <div
                                key={check.index}
                                className="p-4 border-2 border-slate-100 rounded-xl hover:border-indigo-200 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-semibold text-slate-900">
                                                {formatAmount(check.amount)} RLUSD
                                            </p>
                                            <Button
                                                size="sm"
                                                onClick={() => handleCashCheck(check)}
                                                disabled={claimingId === check.index}
                                            >
                                                {claimingId === check.index ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                        Claiming...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Claim
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <p className="text-sm text-slate-500 font-mono truncate">
                                            From: {formatAddress(check.sender, 8)}
                                        </p>
                                        {check.memo && (
                                            <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                                                    <p className="text-sm text-slate-600">&quot;{check.memo}&quot;</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
