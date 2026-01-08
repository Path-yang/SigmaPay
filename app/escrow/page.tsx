"use client";

import { EscrowList } from "@/components/escrow/EscrowList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Info, Clock, Shield, Lock } from "lucide-react";

export default function EscrowPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Conditional and scheduled payments with on-chain escrow
          </p>
        </div>
        <Link href="/escrow/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Escrow
          </Button>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">What is Escrow?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Escrow lets you lock XRP with conditions for release. Use it for:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span><strong>Scheduled payments</strong> - Birthday gifts, subscriptions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  <span><strong>Conditional payments</strong> - Release when work is done</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  <span><strong>Buyer protection</strong> - Safe P2P transactions</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-chart-4 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Time-locked</p>
            <p className="text-xs text-muted-foreground">Set release date</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Secure</p>
            <p className="text-xs text-muted-foreground">On-chain locked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Lock className="w-6 h-6 text-chart-5 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Conditional</p>
            <p className="text-xs text-muted-foreground">Secret codes</p>
          </CardContent>
        </Card>
      </div>

      {/* Escrow List */}
      <EscrowList />
    </div>
  );
}
