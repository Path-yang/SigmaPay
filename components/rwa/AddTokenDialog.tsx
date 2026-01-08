"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { addTokenToMarketplace } from "@/lib/xrpl/rwa";
import { Loader2, Plus, Search } from "lucide-react";

interface AddTokenDialogProps {
  open: boolean;
  onClose: () => void;
  onTokenAdded?: () => void;
}

export function AddTokenDialog({ open, onClose, onTokenAdded }: AddTokenDialogProps) {
  const [issuer, setIssuer] = useState("");
  const [currency, setCurrency] = useState("");
  const [displayName, setDisplayName] = useState(""); // Optional display name
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!issuer || !currency) {
      toast({
        title: "Missing Information",
        description: "Please provide both issuer address and token currency.",
        variant: "destructive",
      });
      return;
    }

    if (!issuer.startsWith("r") || issuer.length < 25) {
      toast({
        title: "Invalid Issuer Address",
        description: "XRPL addresses start with 'r' and are at least 25 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Pass the display name to the marketplace function
      const result = await addTokenToMarketplace(currency, issuer, displayName || currency);
      
      if (result.success) {
        toast({
          title: "Token Added! 🎉",
          description: `Successfully added ${result.token?.metadata?.name || displayName || currency} to the marketplace.`,
          variant: "default",
        });
        
        onTokenAdded?.();
        onClose();
        setIssuer("");
        setCurrency("");
        setDisplayName("");
      } else {
        toast({
          title: "Token Not Found",
          description: result.error || "Could not find the specified token. Please verify the issuer address and token symbol are correct.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add token.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setIssuer("");
      setCurrency("");
      setDisplayName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Add Token to Marketplace
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <p className="font-semibold mb-1">Can't find a token?</p>
            <p>If someone shared a token with you but you can't find it in the marketplace, you can add it manually using the issuer's address and token currency.</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="issuer">Issuer Address *</Label>
              <Input
                id="issuer"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value.trim())}
                placeholder="rXXXXXXXX..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">The XRPL address that created the token</p>
            </div>

            <div>
              <Label htmlFor="currency">Token Symbol *</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => {
                  // Allow letters and numbers, preserve case for display
                  const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                  setCurrency(value);
                  // Auto-set display name if not manually set
                  if (!displayName || displayName === currency) {
                    setDisplayName(value);
                  }
                }}
                placeholder="e.g., Zaixi, GOLD, MAPT1"
                maxLength={20}
              />
              <p className="text-xs text-slate-500 mt-1">The token symbol (as shown by issuer)</p>
            </div>

            <div>
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Zaixi Gold Token"
                maxLength={50}
              />
              <p className="text-xs text-slate-500 mt-1">Friendly name for this token</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={loading} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !issuer || !currency} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Token
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}