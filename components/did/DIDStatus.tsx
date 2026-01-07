"use client";

import { VerificationLevel, VERIFICATION_BENEFITS, getLimitDisplay } from "@/lib/xrpl/constants";
import { VerificationBadge } from "./VerificationBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

interface DIDStatusProps {
  level: VerificationLevel;
  showUpgradePrompt?: boolean;
}

export function DIDStatus({ level, showUpgradePrompt = true }: DIDStatusProps) {
  const benefits = VERIFICATION_BENEFITS[level];
  const isFullyVerified = level === VerificationLevel.VERIFIED;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Verification Status</CardTitle>
          <VerificationBadge level={level} size="md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Send Limit</p>
            <p className="text-lg font-bold text-slate-900">{getLimitDisplay(level)}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Transfer Method</p>
            <p className="text-lg font-bold text-slate-900">{benefits.method}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Your Benefits:</p>
          <ul className="space-y-1.5">
            {benefits.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {showUpgradePrompt && !isFullyVerified && (
          <Link href="/verify" className="block">
            <Button className="w-full" variant="outline">
              Upgrade Verification
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

