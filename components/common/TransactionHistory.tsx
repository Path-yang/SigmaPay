"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/components/wallet/WalletProvider";
import { getTransactionHistory, Transaction } from "@/lib/xrpl/transactions";
import { formatAddress, formatAmount, formatRelativeTime } from "@/lib/utils/format";
import { getExplorerTxLink } from "@/lib/xrpl/constants";
import {
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    ExternalLink,
    RefreshCw,
    MessageSquare,
    Lock,
    Unlock,
    Ban
} from "lucide-react";

export function TransactionHistory() {
    const { address, wallet } = useWallet();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "sent" | "received" | "escrow">("all");

    const loadTransactions = useCallback(async () => {
        if (!address) return;

        setIsLoading(true);
        try {
            const txs = await getTransactionHistory(address);
            setTransactions(txs);
        } catch (err) {
            console.error("Failed to load transactions:", err);
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    useEffect(() => {
        if (wallet) {
            loadTransactions();
        }
    }, [wallet, loadTransactions]);

    const filteredTransactions = transactions.filter((tx) => {
        if (filter === "all") return true;
        if (filter === "escrow") {
            return tx.type === "escrow_created" || tx.type === "escrow_finished" || tx.type === "escrow_cancelled";
        }
        return tx.type === filter;
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Transaction History
                        </CardTitle>
                        <CardDescription>
                            Your recent RLUSD transactions
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadTransactions}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                    <TabsList className="w-full mb-4">
                        <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                        <TabsTrigger value="sent" className="flex-1">Sent</TabsTrigger>
                        <TabsTrigger value="received" className="flex-1">Received</TabsTrigger>
                        <TabsTrigger value="escrow" className="flex-1">Escrow</TabsTrigger>
                    </TabsList>

                    <TabsContent value={filter} className="mt-0">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-24 mb-2" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-1">No Transactions</h3>
                                <p className="text-slate-500 text-sm">
                                    {filter === "all"
                                        ? "Your transactions will appear here"
                                        : filter === "sent"
                                            ? "You haven't sent any payments yet"
                                            : filter === "received"
                                                ? "You haven't received any payments yet"
                                                : "No escrow transactions yet"
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTransactions.map((tx) => {
                                    // Determine icon and colors based on transaction type
                                    const getIconAndColor = () => {
                                        switch (tx.type) {
                                            case "sent":
                                                return {
                                                    icon: <ArrowUpRight className="w-5 h-5" />,
                                                    bg: "bg-orange-100",
                                                    text: "text-orange-600"
                                                };
                                            case "received":
                                                return {
                                                    icon: <ArrowDownLeft className="w-5 h-5" />,
                                                    bg: "bg-emerald-100",
                                                    text: "text-emerald-600"
                                                };
                                            case "escrow_created":
                                                return {
                                                    icon: <Lock className="w-5 h-5" />,
                                                    bg: "bg-blue-100",
                                                    text: "text-blue-600"
                                                };
                                            case "escrow_finished":
                                                return {
                                                    icon: <Unlock className="w-5 h-5" />,
                                                    bg: "bg-emerald-100",
                                                    text: "text-emerald-600"
                                                };
                                            case "escrow_cancelled":
                                                return {
                                                    icon: <Ban className="w-5 h-5" />,
                                                    bg: "bg-slate-100",
                                                    text: "text-slate-600"
                                                };
                                            default:
                                                return {
                                                    icon: <Clock className="w-5 h-5" />,
                                                    bg: "bg-slate-100",
                                                    text: "text-slate-600"
                                                };
                                        }
                                    };

                                    const getLabel = () => {
                                        switch (tx.type) {
                                            case "sent": return "Sent";
                                            case "received": return "Received";
                                            case "escrow_created": return "Escrow Created";
                                            case "escrow_finished": return "Escrow Claimed";
                                            case "escrow_cancelled": return "Escrow Cancelled";
                                            default: return tx.type;
                                        }
                                    };

                                    const getCounterpartyLabel = () => {
                                        switch (tx.type) {
                                            case "sent": return "To";
                                            case "received": return "From";
                                            case "escrow_created": return "To";
                                            case "escrow_finished": return "With";
                                            case "escrow_cancelled": return "For";
                                            default: return "";
                                        }
                                    };

                                    const { icon, bg, text } = getIconAndColor();

                                    return (
                                        <div
                                            key={tx.hash}
                                            className="flex items-start gap-4 p-4 border-2 border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg} ${text}`}>
                                                {icon}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div>
                                                        <span className="text-xs text-slate-500 mr-2">{getLabel()}</span>
                                                        <span className="font-semibold text-slate-900">
                                                            {tx.type === "sent" || tx.type === "escrow_created" ? "-" : ""}
                                                            {tx.type === "received" || tx.type === "escrow_finished" ? "+" : ""}
                                                            {tx.type === "escrow_cancelled" ? "↩ " : ""}
                                                            {formatAmount(tx.amount)} {tx.currency}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-400">
                                                        {formatRelativeTime(tx.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 font-mono truncate">
                                                    {getCounterpartyLabel()}: {formatAddress(tx.counterparty, 6)}
                                                </p>
                                                {tx.memo && (
                                                    <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                                                        <MessageSquare className="w-3 h-3" />
                                                        <span className="truncate">&quot;{tx.memo}&quot;</span>
                                                    </div>
                                                )}
                                            </div>

                                            <a
                                                href={getExplorerTxLink(tx.hash)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-slate-400 hover:text-primary transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
