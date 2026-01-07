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
    MessageSquare
} from "lucide-react";

export function TransactionHistory() {
    const { address, wallet } = useWallet();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "sent" | "received">("all");

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
                                            : "You haven't received any payments yet"
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTransactions.map((tx) => (
                                    <div
                                        key={tx.hash}
                                        className="flex items-start gap-4 p-4 border-2 border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "sent"
                                                    ? "bg-orange-100 text-orange-600"
                                                    : "bg-emerald-100 text-emerald-600"
                                                }`}
                                        >
                                            {tx.type === "sent" ? (
                                                <ArrowUpRight className="w-5 h-5" />
                                            ) : (
                                                <ArrowDownLeft className="w-5 h-5" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-semibold text-slate-900">
                                                    {tx.type === "sent" ? "-" : "+"}{formatAmount(tx.amount)} {tx.currency}
                                                </p>
                                                <span className="text-xs text-slate-400">
                                                    {formatRelativeTime(tx.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 font-mono truncate">
                                                {tx.type === "sent" ? "To" : "From"}: {formatAddress(tx.counterparty, 6)}
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
                                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
