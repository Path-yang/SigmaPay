"use client";

import { useEffect, useState } from "react";
import { VerificationLevel } from "@/lib/xrpl/constants";
import { getVerificationLevel } from "@/lib/xrpl/did";
import { VerificationBadge } from "./VerificationBadge";
import { Skeleton } from "@/components/ui/skeleton";

interface SenderTrustBadgeProps {
  senderAddress: string;
  showLabel?: boolean;
}

export function SenderTrustBadge({ senderAddress, showLabel = true }: SenderTrustBadgeProps) {
  const [level, setLevel] = useState<VerificationLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLevel() {
      setLoading(true);
      try {
        const verificationLevel = await getVerificationLevel(senderAddress);
        setLevel(verificationLevel);
      } catch {
        setLevel(VerificationLevel.UNVERIFIED);
      } finally {
        setLoading(false);
      }
    }

    fetchLevel();
  }, [senderAddress]);

  if (loading) {
    return <Skeleton className="h-6 w-24 rounded-full" />;
  }

  return (
    <VerificationBadge 
      level={level || VerificationLevel.UNVERIFIED} 
      showLabel={showLabel}
      size="sm"
    />
  );
}

