"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/components/wallet/WalletProvider";
import { toast } from "@/components/ui/use-toast";
import { RWAToken, sendRWAToken } from "@/lib/xrpl/rwa";
import { getExplorerTxLink } from "@/lib/xrpl/constants";
import { copyTokenInfoToClipboard, createShareMessage } from "@/lib/utils/share-token";
import { 
  Loader2, 
  Check, 
  Send,
  Globe,
  ArrowRight,
  AlertTriangle,
  Share2,
  Copy
} from "lucide-react";

interface SendRWAFormProps {
  token: RWAToken;
  onSuccess?: (hash: string) => void;
  onCancel?: () => void;
}

export function SendRWAForm({ token, onSuccess, onCancel }: SendRWAFormProps) {
  const { wallet } = useWallet();
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [showShareOptions, setShowShareOptions] = useState(false);

  // For issuers, balance might be totalSupply (from metadata)
  // For recipients, balance is actual held tokens
  const maxAmount = parseFloat(token.balance);
  const numAmount = parseFloat(amount) || 0;
  const isValidAmount = numAmount > 0 && numAmount <= maxAmount;
  const isValidRecipient = recipient.startsWith("r") && recipient.length >= 25;
  
  // Check if user is the issuer
  const isIssuer = token.issuer === wallet?.classicAddress;

  const handleShareToken = async () => {
    try {
      if (typeof window === "undefined") {
        toast({
          title: "Share Not Available",
          description: "Token sharing is not available in this environment.",
          variant: "destructive",
        });
        return;
      }

      const baseUrl = window.location.origin;
      const success = await copyTokenInfoToClipboard(token, baseUrl);
      
      if (success) {
        toast({
          title: "Token Info Copied!",
          description: "Share this information with the recipient so they can create a trustline.",
          variant: "default",
        });
      } else {
        // Fallback: show the share message
        const shareMessage = createShareMessage(token, "", baseUrl);
        console.log("Share message:", shareMessage);
        toast({
          title: "Share Token Info",
          description: "Token information is available in the browser console. Copy and share it with the recipient.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Share token error:", error);
      toast({
        title: "Share Failed",
        description: "Could not copy token information to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!wallet || !isValidAmount || !isValidRecipient) {
      toast({
        title: "Invalid Input",
        description: "Please check your recipient address and amount.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Starting RWA token transfer:", {
        recipient,
        amount,
        currency: token.currency,
        issuer: token.issuer === "demo" ? wallet.classicAddress : token.issuer,
      });

      const result = await sendRWAToken(
        wallet,
        recipient,
        token.currency,
        amount,
        token.issuer === "demo" ? wallet.classicAddress : token.issuer,
        memo || undefined
      );

      if (result.success) {
        setSuccess(true);
        setTxHash(result.hash || "");
        toast({ 
          title: "Transfer Successful!", 
          description: `Sent ${amount} ${token.currencyDisplay} to ${recipient.substring(0, 8)}...`, 
          variant: "success" 
        });
        onSuccess?.(result.hash || "");
      } else {
        // Handle different error types with better messaging
        let title = "Transfer Failed";
        let description = result.error || "Unknown error occurred";
        
        if (result.needsTrustline) {
          title = "Trustline Required";
          description = result.error + "\n\nShare this token info with the recipient:\n• Token: " + token.currencyDisplay + "\n• Issuer: " + token.issuer.substring(0, 12) + "...";
        } else if (result.error?.includes("Insufficient balance")) {
          title = "Insufficient Balance";
        } else if (result.error?.includes("Invalid recipient")) {
          title = "Invalid Address";
        }
        
        toast({ 
          title, 
          description, 
          variant: "destructive",
          duration: 10000 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send";
      console.error("Transfer error:", error);
      
      // Handle different types of errors with appropriate messaging
      let title = "Transfer Failed";
      let description = errorMessage;
      let variant: "destructive" | "default" = "destructive";
      
      if (errorMessage.includes("does not have a trustline")) {
        title = "Trustline Required";
        description = errorMessage + "\n\nThe recipient needs to:\n1. Go to RWA Marketplace\n2. Find your token\n3. Click 'Add to Wallet' to create a trustline\n4. Then you can send them the tokens";
      } else if (errorMessage.includes("Insufficient balance")) {
        title = "Insufficient Balance";
        description = errorMessage;
      } else if (errorMessage.includes("Invalid recipient")) {
        title = "Invalid Address";
        description = errorMessage;
      } else if (errorMessage.includes("submitted") && errorMessage.includes("not confirmed")) {
        title = "Transaction Submitted";
        description = errorMessage;
        variant = "default";
      } else if (errorMessage.includes("timeout")) {
        title = "Network Timeout";
        description = "The transaction timed out due to network congestion. Please try again in a few moments.";
      }
      
      toast({ 
        title, 
        description,
        variant,
        duration: 12000 // Show longer for error messages
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Transfer Complete! 🌍</CardTitle>
          <CardDescription className="text-green-700">
            Your RWA tokens have been sent successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white rounded-xl space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Asset</span>
              <span className="font-semibold">{token.metadata?.name || token.currencyDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Amount</span>
              <span className="font-semibold">{amount} {token.currencyDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Recipient</span>
              <span className="font-mono text-xs">{recipient.substring(0, 12)}...{recipient.slice(-6)}</span>
            </div>
            {txHash && (
              <div className="pt-2 border-t">
                <a 
                  href={getExplorerTxLink(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  View on XRPL Explorer →
                </a>
              </div>
            )}
          </div>

          <Button onClick={onCancel} className="w-full">
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-600" />
          Send RWA Overseas
        </CardTitle>
        <CardDescription>
          Transfer {token.metadata?.name || token.currencyDisplay} to anyone worldwide
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Asset Info */}
        <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{token.metadata?.name || token.currencyDisplay}</p>
            <p className="text-xs text-slate-500">{token.currencyDisplay}</p>
            {isIssuer && (
              <p className="text-xs text-indigo-600 mt-1">You are the issuer</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">
              {isIssuer ? "Can Issue" : "Available"}
            </p>
            <p className="font-bold">{maxAmount.toLocaleString()}</p>
            {token.metadata?.totalSupply && isIssuer && (
              <p className="text-xs text-slate-500">
                Total Supply: {parseFloat(token.metadata.totalSupply).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Recipient */}
        <div>
          <Label htmlFor="recipient">Recipient Address *</Label>
          <Input
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="rXXXXXXXX..."
            className={!recipient || isValidRecipient ? "" : "border-red-300"}
          />
          {recipient && !isValidRecipient && (
            <p className="text-xs text-red-500 mt-1">Enter a valid XRPL address</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <div className="flex justify-between items-center">
            <Label htmlFor="amount">Amount *</Label>
            <button 
              type="button"
              onClick={() => setAmount(maxAmount.toString())}
              className="text-xs text-indigo-600 hover:underline"
            >
              Max
            </button>
          </div>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            max={maxAmount}
            step="0.01"
          />
          {numAmount > maxAmount && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Exceeds available balance
            </p>
          )}
        </div>

        {/* Memo */}
        <div>
          <Label htmlFor="memo">Message (Optional)</Label>
          <Textarea
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Add a note for the recipient..."
            rows={2}
          />
        </div>

        {/* Value estimate */}
        {token.metadata?.unitValue && numAmount > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Estimated value: <strong>${(numAmount * parseFloat(token.metadata.unitValue)).toLocaleString()}</strong>
          </div>
        )}

        {/* Trustline help */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <div className="flex items-start gap-2">
            <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Recipient needs a trustline</p>
              <p className="text-xs">The recipient must create a trustline for this token before they can receive it.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareToken}
                className="mt-2 h-7 text-xs"
              >
                <Share2 className="w-3 h-3 mr-1" />
                Share Token Info
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !isValidAmount || !isValidRecipient}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

