"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import { Navbar } from "@/components/common/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { getClient } from "@/lib/xrpl/client";
import { RLUSD_CURRENCY, RLUSD_ISSUER } from "@/lib/xrpl/constants";
import { getRWATokens, RWAToken } from "@/lib/xrpl/rwa";
import { 
  Loader2, 
  ArrowLeftRight, 
  ArrowLeft,
  TrendingUp,
  Coins,
  AlertTriangle
} from "lucide-react";

export default function TradePage() {
  const router = useRouter();
  const { wallet, address, isLoading: walletLoading, hasWallet } = useWallet();

  const [myTokens, setMyTokens] = useState<RWAToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [sellToken, setSellToken] = useState<string>("");
  const [sellAmount, setSellAmount] = useState("");
  const [buyType, setBuyType] = useState<"XRP" | "RLUSD">("XRP");
  const [buyAmount, setBuyAmount] = useState("");

  useEffect(() => {
    if (!walletLoading && !hasWallet) {
      router.push("/onboarding");
    }
  }, [walletLoading, hasWallet, router]);

  useEffect(() => {
    async function loadTokens() {
      if (!address) return;
      try {
        const tokens = await getRWATokens(address);
        setMyTokens(tokens.filter(t => parseFloat(t.balance) > 0));
      } catch (error) {
        console.error("Failed to load tokens:", error);
      } finally {
        setLoading(false);
      }
    }
    loadTokens();
  }, [address]);

  const selectedToken = myTokens.find(t => t.currency === sellToken);

  const handleCreateOffer = async () => {
    if (!wallet || !selectedToken) {
      toast({ title: "Error", description: "Please select a token and unlock your wallet", variant: "destructive" });
      return;
    }

    const sellAmt = parseFloat(sellAmount);
    const buyAmt = parseFloat(buyAmount);
    
    if (isNaN(sellAmt) || sellAmt <= 0 || isNaN(buyAmt) || buyAmt <= 0) {
      toast({ title: "Invalid amounts", description: "Please enter valid amounts", variant: "destructive" });
      return;
    }

    if (sellAmt > parseFloat(selectedToken.balance)) {
      toast({ title: "Insufficient balance", description: "You don't have enough tokens", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const client = await getClient();
      
      // Build the offer
      // TakerGets = what the taker (buyer) gets = your RWA tokens
      // TakerPays = what the taker (buyer) pays = XRP or RLUSD
      
      const takerGets = {
        currency: selectedToken.currency,
        issuer: selectedToken.issuer,
        value: sellAmount,
      };

      let takerPays: any;
      if (buyType === "XRP") {
        // XRP is specified in drops (1 XRP = 1,000,000 drops)
        takerPays = (parseFloat(buyAmount) * 1000000).toString();
      } else {
        // RLUSD
        takerPays = {
          currency: RLUSD_CURRENCY,
          issuer: RLUSD_ISSUER,
          value: buyAmount,
        };
      }

      const offerCreate: any = {
        TransactionType: "OfferCreate",
        Account: wallet.classicAddress,
        TakerGets: takerGets,
        TakerPays: takerPays,
      };

      console.log("Creating offer:", offerCreate);

      const prepared = await client.autofill(offerCreate);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      const txResult = result.result as any;
      
      if (txResult.meta?.TransactionResult === "tesSUCCESS") {
        toast({ 
          title: "Offer Created! 🎉", 
          description: `Selling ${sellAmount} ${selectedToken.currencyDisplay} for ${buyAmount} ${buyType}`,
          variant: "success" 
        });
        
        // Reset form
        setSellAmount("");
        setBuyAmount("");
      } else {
        toast({ 
          title: "Offer Failed", 
          description: txResult.meta?.TransactionResult || "Unknown error",
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Offer creation error:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create offer",
        variant: "destructive" 
      });
    } finally {
      setCreating(false);
    }
  };

  if (walletLoading || !wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.push("/rwa")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to RWA Marketplace
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Trade RWA Tokens</h1>
          <p className="text-slate-600">
            Create offers to trade your RWA tokens for XRP or RLUSD
          </p>
        </div>

        {/* Warning Card */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Experimental Feature</p>
                <p>This uses XRPL's built-in DEX. Your offer will be posted to the order book. 
                   If someone accepts it, the trade executes automatically.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
              Create Sell Offer
            </CardTitle>
            <CardDescription>
              Sell your RWA tokens for XRP or RLUSD
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : myTokens.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Coins className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>You don't have any RWA tokens to trade.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => router.push("/tokenize")}
                >
                  Create a Token
                </Button>
              </div>
            ) : (
              <>
                {/* Selling */}
                <div className="p-4 bg-red-50 rounded-xl space-y-3">
                  <h3 className="font-semibold text-red-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    You're Selling
                  </h3>
                  
                  <div>
                    <Label>Select Token</Label>
                    <select 
                      value={sellToken}
                      onChange={(e) => setSellToken(e.target.value)}
                      className="w-full p-2 border rounded-lg mt-1"
                    >
                      <option value="">Choose a token...</option>
                      {myTokens.map((token) => (
                        <option key={`${token.currency}-${token.issuer}`} value={token.currency}>
                          {token.currencyDisplay} (Balance: {parseFloat(token.balance).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Amount to Sell</Label>
                    <Input
                      type="number"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      placeholder="0.00"
                      max={selectedToken ? parseFloat(selectedToken.balance) : undefined}
                    />
                    {selectedToken && (
                      <p className="text-xs text-slate-500 mt-1">
                        Available: {parseFloat(selectedToken.balance).toLocaleString()} {selectedToken.currencyDisplay}
                      </p>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>

                {/* Buying */}
                <div className="p-4 bg-green-50 rounded-xl space-y-3">
                  <h3 className="font-semibold text-green-800 flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    You Want to Receive
                  </h3>
                  
                  <div>
                    <Label>Currency</Label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        variant={buyType === "XRP" ? "default" : "outline"}
                        onClick={() => setBuyType("XRP")}
                        className="flex-1"
                      >
                        XRP
                      </Button>
                      <Button
                        variant={buyType === "RLUSD" ? "default" : "outline"}
                        onClick={() => setBuyType("RLUSD")}
                        className="flex-1"
                      >
                        RLUSD
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Amount to Receive</Label>
                    <Input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Summary */}
                {sellAmount && buyAmount && selectedToken && (
                  <div className="p-4 bg-indigo-50 rounded-xl">
                    <p className="text-sm text-indigo-800">
                      <strong>Your offer:</strong> Selling {sellAmount} {selectedToken.currencyDisplay} for {buyAmount} {buyType}
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">
                      Rate: 1 {selectedToken.currencyDisplay} = {(parseFloat(buyAmount) / parseFloat(sellAmount)).toFixed(4)} {buyType}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  onClick={handleCreateOffer}
                  disabled={creating || !sellToken || !sellAmount || !buyAmount}
                  className="w-full"
                  size="lg"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating Offer...
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="w-4 h-4 mr-2" />
                      Create Sell Offer
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How DEX Trading Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>1. <strong>Create an offer</strong> - Post what you want to sell and what you want in return</p>
            <p>2. <strong>Order book</strong> - Your offer joins the XRPL order book</p>
            <p>3. <strong>Matching</strong> - If someone wants to buy at your price, trade executes</p>
            <p>4. <strong>Atomic swap</strong> - Exchange happens instantly, no middleman</p>
            <p className="text-xs text-slate-400 pt-2">
              View open offers on <a href="https://testnet.xrpl.org" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">XRPL Testnet Explorer</a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
