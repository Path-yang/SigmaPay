"use client";

import { SendForm } from "@/components/send/SendForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Zap, Shield, Globe } from "lucide-react";

export default function SendPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Info Banner */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Info className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Send RLUSD Globally</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Transfer stablecoin instantly to any XRPL address with near-zero fees.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <Zap className="w-6 h-6 text-chart-4 mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">3-5 sec</p>
                        <p className="text-xs text-muted-foreground">Settlement</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">Verified</p>
                        <p className="text-xs text-muted-foreground">DID Protected</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <Globe className="w-6 h-6 text-chart-2 mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">Global</p>
                        <p className="text-xs text-muted-foreground">No Borders</p>
                    </CardContent>
                </Card>
            </div>

            {/* Send Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Send Payment</CardTitle>
                    <CardDescription>Enter recipient address and amount</CardDescription>
                </CardHeader>
                <CardContent>
                    <SendForm />
                </CardContent>
            </Card>
        </div>
    );
}
