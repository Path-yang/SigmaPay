"use client";

import { VerificationLevel, LIMITS, getLimitDisplay } from "@/lib/xrpl/constants";
import { AlertTriangle, Info } from "lucide-react";
import Link from "next/link";

interface LimitWarningProps {
  amount: number;
  verificationLevel: VerificationLevel;
  onVerifyClick?: () => void;
}

export function LimitWarning({ amount, verificationLevel, onVerifyClick }: LimitWarningProps) {
  const limit = LIMITS[verificationLevel];
  const isOverLimit = amount > limit;
  const isUnverified = verificationLevel === VerificationLevel.UNVERIFIED;

  // Don't show warning if verified and within limits
  if (!isOverLimit && !isUnverified) {
    return null;
  }

  // Over limit warning
  if (isOverLimit) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Amount exceeds your limit</p>
            <p className="text-sm text-red-700 mt-1">
              Your {verificationLevel} account limit is {getLimitDisplay(verificationLevel)}.{" "}
              {onVerifyClick ? (
                <button onClick={onVerifyClick} className="underline font-medium hover:text-red-900">
                  Verify your identity
                </button>
              ) : (
                <Link href="/verify" className="underline font-medium hover:text-red-900">
                  Verify your identity
                </Link>
              )}{" "}
              to increase your limit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Unverified user info (will use check)
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex gap-3">
        <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Sending via Claimable Check</p>
          <p className="text-sm text-amber-700 mt-1">
            As an unverified user, your transfer will be sent as a claimable check.{" "}
            {onVerifyClick ? (
              <button onClick={onVerifyClick} className="underline font-medium hover:text-amber-900">
                Verify now
              </button>
            ) : (
              <Link href="/verify" className="underline font-medium hover:text-amber-900">
                Verify now
              </Link>
            )}{" "}
            to enable instant direct transfers.
          </p>
        </div>
      </div>
    </div>
  );
}

