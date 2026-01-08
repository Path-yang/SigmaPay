"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EscrowInfo, StoredEscrow } from "@/lib/xrpl/escrow";
import { formatAmount } from "@/lib/utils/format";
import { Key, Loader2, Unlock, AlertCircle } from "lucide-react";

interface ClaimEscrowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escrow: EscrowInfo | StoredEscrow | null;
  onClaim: (fulfillment: string) => void;
  isLoading?: boolean;
}

export function ClaimEscrowDialog({
  open,
  onOpenChange,
  escrow,
  onClaim,
  isLoading = false,
}: ClaimEscrowDialogProps) {
  const [fulfillment, setFulfillment] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Validate fulfillment format (should be hex)
  const isValidFulfillment = (value: string) => {
    // PREIMAGE-SHA-256 fulfillment format: A0228020 + preimage (64 hex chars)
    // Total: 72 hex characters
    // A0 = CHOICE tag type 0, 22 = length 34, 80 = preimage tag, 20 = length 32
    return /^A0228020[A-Fa-f0-9]{64}$/i.test(value);
  };

  const handleSubmit = () => {
    setError(null);

    if (!fulfillment.trim()) {
      setError("Please enter the secret code");
      return;
    }

    const trimmed = fulfillment.trim().toUpperCase();
    
    if (!isValidFulfillment(trimmed)) {
      setError("Invalid secret code format. It should be a 72-character hex string starting with A0228020.");
      return;
    }

    onClaim(trimmed);
  };

  const handleClose = () => {
    setFulfillment("");
    setError(null);
    onOpenChange(false);
  };

  if (!escrow) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-500" />
            Enter Secret Code
          </DialogTitle>
          <DialogDescription>
            This escrow requires a secret code to claim. Enter the code shared by the sender.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Escrow details */}
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount</span>
              <span className="font-semibold">{formatAmount(escrow.amount)} XRP</span>
            </div>
            {escrow.finishAfter && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Unlock time</span>
                <span>{new Date(escrow.finishAfter * 1000).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Fulfillment input */}
          <div className="space-y-2">
            <Label htmlFor="fulfillment">Secret Code (Fulfillment)</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="fulfillment"
                placeholder="A0228020..."
                value={fulfillment}
                onChange={(e) => {
                  setFulfillment(e.target.value);
                  setError(null);
                }}
                className="pl-10 font-mono text-sm"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-slate-500">
              The secret code should have been shared with you by the sender
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={isLoading || !fulfillment.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                Claim Escrow
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
