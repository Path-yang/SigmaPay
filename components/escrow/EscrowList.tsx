"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/components/wallet/WalletProvider";
import { EscrowCard } from "./EscrowCard";
import { ClaimEscrowDialog } from "./ClaimEscrowDialog";
import { 
  getEscrowsForAddress, 
  getStoredEscrows, 
  StoredEscrow,
  EscrowInfo,
  finishEscrow,
  cancelEscrow,
  removeStoredEscrow
} from "@/lib/xrpl/escrow";
import { getWalletFromSeed } from "@/lib/xrpl/wallet";
import { toast } from "@/components/ui/use-toast";
import { getExplorerTxLink } from "@/lib/xrpl/constants";
import { 
  Lock, 
  Inbox, 
  Send,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";

export function EscrowList() {
  const { wallet, address, refreshBalances } = useWallet();
  
  const [sentEscrows, setSentEscrows] = useState<(EscrowInfo | StoredEscrow)[]>([]);
  const [receivedEscrows, setReceivedEscrows] = useState<(EscrowInfo | StoredEscrow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Claim dialog state
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowInfo | StoredEscrow | null>(null);

  // Fetch escrows from chain and local storage
  const fetchEscrows = async () => {
    if (!address) return;

    setLoading(true);
    try {
      // Get escrows from chain
      const chainEscrows = await getEscrowsForAddress(address);
      
      // Get escrows from local storage (includes fulfillments)
      const storedEscrows = getStoredEscrows(address);

      // Merge chain escrows with stored data for SENT escrows
      const mergedSent = chainEscrows.sent.map(escrow => {
        const stored = storedEscrows.sent.find(
          s => s.owner === escrow.owner && s.sequence === escrow.sequence
        );
        if (stored) {
          return { ...escrow, ...stored, status: escrow.status };
        }
        return escrow;
      });

      // Add any stored sent escrows not on chain (might be finished/cancelled)
      for (const stored of storedEscrows.sent) {
        if (!mergedSent.find(e => 
          e.owner === stored.owner && e.sequence === stored.sequence
        )) {
          // Mark as possibly completed if not on chain
          // Add index placeholder for stored escrows
          mergedSent.push({ 
            ...stored, 
            index: `stored-${stored.owner}-${stored.sequence}`,
            status: "completed" as const 
          });
        }
      }

      // Merge chain escrows with stored data for RECEIVED escrows
      // Chain escrows have the authoritative status, stored escrows may have extra data
      const mergedReceived = chainEscrows.received.map(escrow => {
        const stored = storedEscrows.received.find(
          s => s.owner === escrow.owner && s.sequence === escrow.sequence
        );
        if (stored) {
          // Merge stored data (like fulfillment) but use chain status
          return { ...escrow, ...stored, status: escrow.status };
        }
        return escrow;
      });

      // Add any stored received escrows not on chain (might be finished/cancelled)
      for (const stored of storedEscrows.received) {
        if (!mergedReceived.find(e => 
          e.owner === stored.owner && e.sequence === stored.sequence
        )) {
          // Mark as possibly completed if not on chain
          // Add index placeholder for stored escrows
          mergedReceived.push({ 
            ...stored, 
            index: `stored-${stored.owner}-${stored.sequence}`,
            status: "completed" as const 
          });
        }
      }

      setSentEscrows(mergedSent);
      setReceivedEscrows(mergedReceived);
    } catch (error) {
      console.error("Failed to fetch escrows:", error);
      toast({
        title: "Failed to load escrows",
        description: "Please try refreshing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrows();
  }, [address]);

  // Handle claim button click
  const handleClaimClick = (escrow: EscrowInfo | StoredEscrow) => {
    if (escrow.condition) {
      // Need fulfillment - open dialog
      setSelectedEscrow(escrow);
      setClaimDialogOpen(true);
    } else {
      // Time-based only - claim directly
      handleClaim(escrow);
    }
  };

  // Handle claim escrow
  const handleClaim = async (escrow: EscrowInfo | StoredEscrow, fulfillment?: string) => {
    if (!wallet) return;

    const escrowId = `${escrow.owner}-${escrow.sequence}`;
    setActionLoading(escrowId);

    try {
      const xrplWallet = getWalletFromSeed(wallet.seed!);
      
      const usedFulfillment = fulfillment || ("fulfillment" in escrow ? escrow.fulfillment : undefined);
      
      const result = await finishEscrow(xrplWallet, {
        owner: escrow.owner,
        sequence: escrow.sequence,
        condition: escrow.condition,
        fulfillment: usedFulfillment,
      });

      if (result.success) {
        toast({
          title: "Escrow claimed!",
          description: (
            <span>
              Successfully claimed {escrow.amount} XRP.{" "}
              {result.hash && (
                <a 
                  href={getExplorerTxLink(result.hash)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View transaction
                </a>
              )}
            </span>
          ),
          variant: "success",
        });

        // Remove from local storage
        removeStoredEscrow(escrow.owner, escrow.sequence);
        
        // Refresh
        await fetchEscrows();
        await refreshBalances();
        
        setClaimDialogOpen(false);
        setSelectedEscrow(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Failed to claim escrow",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle cancel escrow
  const handleCancel = async (escrow: EscrowInfo | StoredEscrow) => {
    if (!wallet) return;

    const escrowId = `${escrow.owner}-${escrow.sequence}`;
    setActionLoading(escrowId);

    try {
      const xrplWallet = getWalletFromSeed(wallet.seed!);
      
      const result = await cancelEscrow(xrplWallet, {
        owner: escrow.owner,
        sequence: escrow.sequence,
      });

      if (result.success) {
        toast({
          title: "Escrow cancelled",
          description: (
            <span>
              {escrow.amount} XRP has been returned to your wallet.{" "}
              {result.hash && (
                <a 
                  href={getExplorerTxLink(result.hash)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View transaction
                </a>
              )}
            </span>
          ),
          variant: "success",
        });

        // Remove from local storage
        removeStoredEscrow(escrow.owner, escrow.sequence);
        
        // Refresh
        await fetchEscrows();
        await refreshBalances();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Failed to cancel escrow",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Escrows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const totalEscrows = sentEscrows.length + receivedEscrows.length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Your Escrows
              </CardTitle>
              <CardDescription>
                Manage your escrowed XRP payments
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchEscrows}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {totalEscrows === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No escrows yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Create an escrow to send conditional or scheduled payments
              </p>
            </div>
          ) : (
            <Tabs defaultValue="sent" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="sent" className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  Sent ({sentEscrows.length})
                </TabsTrigger>
                <TabsTrigger value="received" className="flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4" />
                  Received ({receivedEscrows.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sent" className="space-y-3">
                {sentEscrows.length === 0 ? (
                  <div className="text-center py-8">
                    <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No sent escrows</p>
                  </div>
                ) : (
                  sentEscrows.map((escrow, idx) => (
                    <EscrowCard
                      key={`${escrow.owner}-${escrow.sequence}-${idx}`}
                      escrow={escrow}
                      type="sent"
                      onCancel={handleCancel}
                      isLoading={actionLoading === `${escrow.owner}-${escrow.sequence}`}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="received" className="space-y-3">
                {receivedEscrows.length === 0 ? (
                  <div className="text-center py-8">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No incoming escrows</p>
                  </div>
                ) : (
                  receivedEscrows.map((escrow, idx) => (
                    <EscrowCard
                      key={`${escrow.owner}-${escrow.sequence}-${idx}`}
                      escrow={escrow}
                      type="received"
                      onClaim={handleClaimClick}
                      isLoading={actionLoading === `${escrow.owner}-${escrow.sequence}`}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Claim dialog for condition-based escrows */}
      <ClaimEscrowDialog
        open={claimDialogOpen}
        onOpenChange={setClaimDialogOpen}
        escrow={selectedEscrow}
        onClaim={(fulfillment) => {
          if (selectedEscrow) {
            handleClaim(selectedEscrow, fulfillment);
          }
        }}
        isLoading={!!actionLoading}
      />
    </>
  );
}
