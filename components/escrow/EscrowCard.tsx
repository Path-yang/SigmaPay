"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAmount, formatAddress } from "@/lib/utils/format";
import { 
  EscrowInfo, 
  StoredEscrow, 
  getEscrowStatusDisplay,
  EscrowStatus 
} from "@/lib/xrpl/escrow";
import { 
  Clock, 
  Lock, 
  Unlock, 
  Key,
  Ban,
  CheckCircle,
  Calendar,
  User,
  Coins,
  Copy,
  Check
} from "lucide-react";

interface EscrowCardProps {
  escrow: EscrowInfo | StoredEscrow;
  type: "sent" | "received";
  onClaim?: (escrow: EscrowInfo | StoredEscrow) => void;
  onCancel?: (escrow: EscrowInfo | StoredEscrow) => void;
  isLoading?: boolean;
}

export function EscrowCard({ 
  escrow, 
  type, 
  onClaim, 
  onCancel,
  isLoading = false 
}: EscrowCardProps) {
  const [copiedFulfillment, setCopiedFulfillment] = useState(false);

  // Get status display info
  const status = "status" in escrow ? escrow.status : "pending";
  const statusInfo = getEscrowStatusDisplay(status as EscrowStatus);

  // Check if has condition (needs fulfillment to claim)
  const hasCondition = !!escrow.condition;
  
  // Check if has fulfillment (sender can share it)
  const hasFulfillment = "fulfillment" in escrow && !!escrow.fulfillment;

  // Format dates
  const finishDate = escrow.finishAfter 
    ? new Date(escrow.finishAfter * 1000).toLocaleString() 
    : null;
  const cancelDate = escrow.cancelAfter 
    ? new Date(escrow.cancelAfter * 1000).toLocaleString() 
    : null;

  // Determine if can claim/cancel based on status and type
  const canClaim = type === "received" && (status === "claimable" || (hasCondition && status === "pending"));
  const canCancel = type === "sent" && status === "cancellable";

  // Handle copy fulfillment
  const handleCopyFulfillment = async () => {
    if (!("fulfillment" in escrow) || !escrow.fulfillment) return;
    
    try {
      await navigator.clipboard.writeText(escrow.fulfillment);
      setCopiedFulfillment(true);
      setTimeout(() => setCopiedFulfillment(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Get status badge color
  const getStatusColor = (s: string) => {
    switch (s) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "claimable": return "bg-green-100 text-green-800 border-green-200";
      case "cancellable": return "bg-orange-100 text-orange-800 border-orange-200";
      case "completed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get card gradient based on type
  const cardGradient = type === "sent" 
    ? "from-primary/10 to-primary/5 border-primary/30"
    : "from-emerald-50 to-teal-50 border-emerald-200";

  return (
    <Card className={`bg-gradient-to-br ${cardGradient}`}>
      <CardContent className="p-4">
        {/* Header: Amount and Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              type === "sent" ? "bg-primary/20" : "bg-emerald-100"
            }`}>
              <Coins className={`w-5 h-5 ${
                type === "sent" ? "text-primary" : "text-emerald-600"
              }`} />
            </div>
            <div>
              <p className={`text-lg font-bold ${
                type === "sent" ? "text-primary" : "text-emerald-900"
              }`}>
                {formatAmount(escrow.amount)} XRP
              </p>
              <p className="text-xs text-slate-500">
                {type === "sent" ? "Sent Escrow" : "Incoming Escrow"}
              </p>
            </div>
          </div>
          <Badge className={`${getStatusColor(status)} border`}>
            {statusInfo.label}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm mb-4">
          {/* Counterparty */}
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <span>{type === "sent" ? "To:" : "From:"}</span>
            <span className="font-mono">
              {formatAddress(type === "sent" ? escrow.destination : escrow.owner, 6)}
            </span>
          </div>

          {/* Release Time */}
          {finishDate && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Unlocks:</span>
              <span>{finishDate}</span>
            </div>
          )}

          {/* Cancel Time */}
          {cancelDate && (
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Cancel after:</span>
              <span>{cancelDate}</span>
            </div>
          )}

          {/* Condition indicator */}
          {hasCondition && (
            <div className="flex items-center gap-2 text-slate-600">
              <Key className="w-4 h-4 text-amber-500" />
              <span className="text-amber-700">Requires secret code to claim</span>
            </div>
          )}

          {/* Memo */}
          {"memo" in escrow && escrow.memo && (
            <div className="p-2 bg-white/50 rounded-lg">
              <p className="text-slate-500 text-xs mb-1">Message:</p>
              <p className="text-slate-700">&quot;{escrow.memo}&quot;</p>
            </div>
          )}
        </div>

        {/* Fulfillment code (for sender only) */}
        {type === "sent" && hasFulfillment && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Secret Code</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-amber-700 hover:text-amber-900"
                onClick={handleCopyFulfillment}
              >
                {copiedFulfillment ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-amber-600 mb-1">Share this with recipient to release funds:</p>
            <p className="font-mono text-xs break-all text-amber-900 bg-amber-100 p-2 rounded">
              {("fulfillment" in escrow && escrow.fulfillment) 
                ? escrow.fulfillment.slice(0, 20) + "..." + escrow.fulfillment.slice(-20)
                : "N/A"}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {canClaim && onClaim && (
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onClaim(escrow)}
              disabled={isLoading}
            >
              {hasCondition ? (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Enter Code to Claim
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Claim
                </>
              )}
            </Button>
          )}
          
          {canCancel && onCancel && (
            <Button
              variant="outline"
              className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
              onClick={() => onCancel(escrow)}
              disabled={isLoading}
            >
              <Ban className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}

          {status === "pending" && !canClaim && !canCancel && (
            <div className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Lock className="w-4 h-4" />
              <span>Waiting for release conditions</span>
            </div>
          )}

          {status === "completed" && (
            <div className="flex-1 flex items-center justify-center gap-2 text-sm text-blue-600">
              <CheckCircle className="w-4 h-4" />
              <span>Escrow completed</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
