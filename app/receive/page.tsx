"use client";

import { ReceiveAddress } from "@/components/receive/ReceiveAddress";
import { ChecksList } from "@/components/receive/ChecksList";
import { Card, CardContent } from "@/components/ui/card";
import { Info, QrCode, FileCheck } from "lucide-react";

export default function ReceivePage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Info Banner */}
            <Card className="bg-chart-2/5 border-chart-2/20">
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                            <Info className="w-5 h-5 text-chart-2" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Receive Payments</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Share your wallet address or QR code to receive RLUSD from anyone.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <QrCode className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">QR Code</p>
                            <p className="text-xs text-muted-foreground">Share to receive</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-chart-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Checks</p>
                            <p className="text-xs text-muted-foreground">Pending claims</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Receive Address with QR */}
            <ReceiveAddress />

            {/* Pending Checks */}
            <ChecksList />
        </div>
    );
}
