"use client";

import { EscrowForm } from "@/components/escrow/EscrowForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Clock, Lock, Shield } from "lucide-react";

export default function CreateEscrowPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Info Banner */}
      <Card className="bg-chart-4/5 border-chart-4/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-chart-4" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Create Secure Escrow</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Lock XRP with time-based or conditional release. Perfect for scheduled gifts or secure transactions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-chart-4 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Time Lock</p>
            <p className="text-xs text-muted-foreground">Schedule release</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Lock className="w-6 h-6 text-chart-5 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Secret Code</p>
            <p className="text-xs text-muted-foreground">Conditional access</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">On-chain</p>
            <p className="text-xs text-muted-foreground">Trustless security</p>
          </CardContent>
        </Card>
      </div>

      {/* Escrow Form */}
      <Card>
        <CardHeader>
          <CardTitle>Escrow Details</CardTitle>
          <CardDescription>Configure your escrow payment conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <EscrowForm />
        </CardContent>
      </Card>
    </div>
  );
}
