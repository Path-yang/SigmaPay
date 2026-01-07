"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/components/wallet/WalletProvider";
import { getIncomingChecks, cashCheck, CheckInfo } from "@/lib/xrpl/checks";
import { getWalletFromSeed } from "@/lib/xrpl/wallet";
import { SenderTrustBadge } from "@/components/did/SenderTrustBadge";
import { formatAmount, formatAddress } from "@/lib/utils/format";
import { getExplorerTxLink } from "@/lib/xrpl/constants";
import { toast } from "@/components/ui/use-toast";
import { 
    Inbox, 
    CheckCircle, 
    Loader2, 
    ExternalLink,
    FileCheck,
    Gift
} from "lucide-react";

export function ChecksList() {
    const { wallet, address, refreshBalances } = useWallet();
    const [checks, setChecks] = useState<CheckInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<string | null>(null);

    const fetchChecks = async () => {
        if (!address) return;

        setLoading(true);
        try {
            const incomingChecks = await getIncomingChecks(address);
            setChecks(incomingChecks);
        } catch (error) {
            console.error("Failed to fetch checks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChecks();
    }, [address]);

    const handleCashCheck = async (check: CheckInfo) => {
        if (!wallet) return;

        setClaimingId(check.index);
        try {
            const xrplWallet = getWalletFromSeed(wallet.seed!);
            const result = await cashCheck(xrplWallet, check.index, check.amount);

            if (result.success) {
                toast({
                    title: "Check claimed!",
                    description: `You received ${formatAmount(check.amount)} ${check.currency}`,
                    variant: "success",
                });
                await fetchChecks();
                await refreshBalances();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: "Failed to claim check",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive",
            });
        } finally {
            setClaimingId(null);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5" />
                        Pending Checks
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5" />
                    Pending Checks
                </CardTitle>
                <CardDescription>
                    Claim checks sent to you
                </CardDescription>
            </CardHeader>
            <CardContent>
                {checks.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Inbox className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500">No pending checks</p>
                        <p className="text-sm text-slate-400">Checks sent to you will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {checks.map((check) => (
                            <div
                                key={check.index}
                                className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Gift className="w-4 h-4 text-emerald-600" />
                                            <span className="font-semibold text-emerald-800">
                                                {formatAmount(check.amount)} {check.currency}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                                            <span>From:</span>
                                            <span className="font-mono">{formatAddress(check.sender, 6)}</span>
                                            <SenderTrustBadge senderAddress={check.sender} showLabel={false} />
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleCashCheck(check)}
                                        disabled={claimingId === check.index}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {claimingId === check.index ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Claim
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Button 
                    variant="ghost" 
                    className="w-full mt-4" 
                    onClick={fetchChecks}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </CardContent>
        </Card>
    );
}
