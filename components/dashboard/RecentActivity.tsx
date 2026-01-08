"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/components/wallet/WalletProvider";
import { getTransactionHistory, Transaction } from "@/lib/xrpl/transactions";
import { formatRelativeTime, formatAddress, formatAmount } from "@/lib/utils/format";
import { getExplorerTxLink } from "@/lib/xrpl/constants";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  ExternalLink,
  RefreshCw,
  Lock,
  Unlock,
  Ban
} from "lucide-react";
import Link from "next/link";

export function RecentActivity() {
  const { address, wallet } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Get icon and colors based on transaction type
  const getIconAndColor = (type: Transaction["type"]) => {
    switch (type) {
      case "sent":
        return {
          icon: <ArrowUpRight className="w-4 h-4" />,
          bgClass: "bg-destructive/10 text-destructive",
          amountClass: "text-destructive",
          prefix: "-"
        };
      case "received":
        return {
          icon: <ArrowDownLeft className="w-4 h-4" />,
          bgClass: "bg-success/10 text-success",
          amountClass: "text-success",
          prefix: "+"
        };
      case "escrow_created":
        return {
          icon: <Lock className="w-4 h-4" />,
          bgClass: "bg-info/10 text-info",
          amountClass: "text-info",
          prefix: "-"
        };
      case "escrow_finished":
        return {
          icon: <Unlock className="w-4 h-4" />,
          bgClass: "bg-success/10 text-success",
          amountClass: "text-success",
          prefix: "+"
        };
      case "escrow_cancelled":
        return {
          icon: <Ban className="w-4 h-4" />,
          bgClass: "bg-muted text-muted-foreground",
          amountClass: "text-muted-foreground",
          prefix: "↩"
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          bgClass: "bg-muted text-muted-foreground",
          amountClass: "text-muted-foreground",
          prefix: ""
        };
    }
  };

  const getLabel = (type: Transaction["type"]) => {
    switch (type) {
      case "sent": return "Sent";
      case "received": return "Received";
      case "escrow_created": return "Escrow Created";
      case "escrow_finished": return "Escrow Claimed";
      case "escrow_cancelled": return "Escrow Cancelled";
      default: return type;
    }
  };

  const getCounterpartyLabel = (type: Transaction["type"]) => {
    switch (type) {
      case "sent": return "To";
      case "received": return "From";
      case "escrow_created": return "To";
      case "escrow_finished": return "From";
      case "escrow_cancelled": return "";
      default: return "";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="text-xs">
              See more
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={loadTransactions}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your transaction history will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show recent transactions (limit to 5)
  const recentTransactions = transactions.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <Link href="/history">
          <Button variant="ghost" size="sm" className="text-xs">
            See more
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {recentTransactions.map((tx) => {
          const { icon, bgClass, amountClass, prefix } = getIconAndColor(tx.type);
          const label = getLabel(tx.type);
          const counterpartyLabel = getCounterpartyLabel(tx.type);

          return (
            <div
              key={tx.hash}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${bgClass}`}>
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {label} {tx.currency}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {counterpartyLabel && `${counterpartyLabel} `}
                    {tx.counterparty !== "Self" ? formatAddress(tx.counterparty, 4) : "Self"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className={`text-sm font-semibold ${amountClass}`}>
                    {prefix}{tx.currency === "RLUSD" ? "$" : ""}{formatAmount(tx.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(new Date(tx.timestamp))}
                  </p>
                </div>
                <a
                  href={getExplorerTxLink(tx.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
