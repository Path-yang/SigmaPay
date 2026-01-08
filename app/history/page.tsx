"use client";

import { TransactionHistory } from "@/components/common/TransactionHistory";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function HistoryPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Info Banner */}
            <Card className="bg-chart-5/5 border-chart-5/20">
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-chart-5/10 flex items-center justify-center flex-shrink-0">
                            <Info className="w-5 h-5 text-chart-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Transaction History</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                View all your XRPL transactions including payments, escrows, and trustlines.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <ArrowUpRight className="w-6 h-6 text-destructive mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">Sent</p>
                        <p className="text-xs text-muted-foreground">Outgoing transfers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <ArrowDownLeft className="w-6 h-6 text-success mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">Received</p>
                        <p className="text-xs text-muted-foreground">Incoming transfers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <Clock className="w-6 h-6 text-chart-4 mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">All Time</p>
                        <p className="text-xs text-muted-foreground">Complete history</p>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History Component */}
            <TransactionHistory />
        </div>
    );
}
