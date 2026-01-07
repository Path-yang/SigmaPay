"use client";

import { useState, useEffect, useCallback } from "react";
import { getDID, createDID, updateVerificationLevel, SigmaPayDID } from "@/lib/xrpl/did";
import { VerificationLevel, LIMITS } from "@/lib/xrpl/constants";
import type { Wallet } from "xrpl";

export function useDID(wallet: Wallet | null, address: string | null) {
  const [did, setDID] = useState<SigmaPayDID | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  const fetchDID = useCallback(async () => {
    if (!address) {
      setDID(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const didData = await getDID(address);
      setDID(didData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch DID");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchDID();
  }, [fetchDID]);

  const initializeDID = async (): Promise<boolean> => {
    if (!wallet) return false;
    
    setInitializing(true);
    setError(null);
    try {
      const result = await createDID(wallet, {
        verificationLevel: VerificationLevel.UNVERIFIED,
      });
      
      if (result.success) {
        await fetchDID();
        return true;
      } else {
        setError(result.error || "Failed to create DID");
        return false;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initialize DID");
      return false;
    } finally {
      setInitializing(false);
    }
  };

  const verify = async (
    level: VerificationLevel,
    data?: { name?: string; email?: string; phone?: string }
  ): Promise<boolean> => {
    if (!wallet) return false;

    setLoading(true);
    setError(null);
    try {
      const result = await updateVerificationLevel(wallet, level, data);
      
      if (result.success) {
        await fetchDID();
        return true;
      } else {
        setError(result.error || "Failed to update verification");
        return false;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to verify");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verificationLevel = did?.verificationLevel || VerificationLevel.UNVERIFIED;
  const sendLimit = LIMITS[verificationLevel];

  return {
    did,
    loading,
    initializing,
    error,
    verificationLevel,
    sendLimit,
    isVerified: verificationLevel !== VerificationLevel.UNVERIFIED,
    isFullyVerified: verificationLevel === VerificationLevel.VERIFIED,
    hasDID: did !== null,
    initializeDID,
    verify,
    refresh: fetchDID,
  };
}

