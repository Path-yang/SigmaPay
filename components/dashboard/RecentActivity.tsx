"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRelativeTime, formatAddress, formatAmount } from "@/lib/utils/format";
import { ArrowUpRight, ArrowDownLeft, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Transaction {
  id: string;
  type: "sent" | "received";
  amount: string;
  currency: string;
  address: string;
  timestamp: Date;
  hash?: string;
}

interface RecentActivityProps {
  transactions?: Transaction[];
}

// Mock data for demonstration
const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "sent",
    amount: "500",
    currency: "RLUSD",
    address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    hash: "ABC123...",
  },
  {
    id: "2",
    type: "received",
    amount: "1,250",
    currency: "RLUSD",
    address: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    hash: "DEF456...",
  },
  {
    id: "3",
    type: "sent",
    amount: "75",
    currency: "RLUSD",
    address: "rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    hash: "GHI789...",
  },
  {
    id: "4",
    type: "received",
    amount: "200",
    currency: "RLUSD",
    address: "rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dczv",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    hash: "JKL012...",
  },
];

export function RecentActivity({ transactions = mockTransactions }: RecentActivityProps) {
  if (transactions.length === 0) {
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
        {transactions.slice(0, 5).map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  tx.type === "sent"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-success/10 text-success"
                }`}
              >
                {tx.type === "sent" ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownLeft className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {tx.type === "sent" ? "Sent" : "Received"} {tx.currency}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tx.type === "sent" ? "To" : "From"} {formatAddress(tx.address, 4)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-semibold ${
                  tx.type === "sent" ? "text-destructive" : "text-success"
                }`}
              >
                {tx.type === "sent" ? "-" : "+"}${tx.amount}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(tx.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
