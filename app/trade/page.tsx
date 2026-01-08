"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { getClient } from "@/lib/xrpl/client";
import { RLUSD_CURRENCY, RLUSD_ISSUER } from "@/lib/xrpl/constants";
import { getRWATokens, getAllMarketplaceTokens, RWAToken } from "@/lib/xrpl/rwa";
import { 
  Loader2, 
  ArrowLeftRight, 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Coins,
  AlertTriangle,
  ShoppingCart,
  Tag
} from "lucide-react";

export default function TradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wallet, address, isLoading: walletLoading, hasWallet } = useWallet();

  const [myTokens, setMyTokens] = useState<RWAToken[]>([]);
  const [marketplaceTokens, setMarketplaceTokens] = useState<RWAToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Sell form state
  const [sellToken, setSellToken] = useState<string>("");
  const [sellAmount, setSellAmount] = useState("");
  const [sellForType, setSellForType] = useState<"XRP" | "RLUSD">("XRP");
  const [sellForAmount, setSellForAmount] = useState("");

  // Buy form state
  const [buyToken, setBuyToken] = useState<string>("");
  const [buyAmount, setBuyAmount] = useState("");
  const [payWithType, setPayWithType] = useState<"XRP" | "RLUSD">("XRP");
  const [payWithAmount, setPayWithAmount] = useState("");

  // Active tab
  const [activeTab, setActiveTab] = useState<string>("sell");

  useEffect(() => {
    if (!walletLoading && !hasWallet) {
      router.push("/onboarding");
    }
  }, [walletLoading, hasWallet, router]);

  useEffect(() => {
    // Check URL for pre-selected token to buy
    const tokenParam = searchParams.get("token");
    const issuerParam = searchParams.get("issuer");
    if (tokenParam && issuerParam) {
      setBuyToken(`${tokenParam}:${issuerParam}`);
      setActiveTab("buy");
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadTokens() {
      if (!address) return;
      try {
        // Get user's RWA tokens (for selling)
        const tokens = await getRWATokens(address);
        setMyTokens(tokens.filter(t => parseFloat(t.balance) > 0));

        // Get marketplace tokens (for buying)
        const marketplace = getAllMarketplaceTokens();
        // Filter out tokens where user is the issuer (can't buy your own)
        setMarketplaceTokens(marketplace.filter(t => t.issuer !== address));
      } catch (error) {
        console.error("Failed to load tokens:", error);
      } finally {
        setLoading(false);
      }
    }
    loadTokens();
  }, [address]);

  const selectedSellToken = myTokens.find(t => t.currency === sellToken);
  const selectedBuyToken = marketplaceTokens.find(t => `${t.currency}:${t.issuer}` === buyToken);

  // Create SELL offer (selling RWA for XRP/RLUSD)
  const handleCreateSellOffer = async () => {
    if (!wallet || !selectedSellToken) {
      toast({ title: "Error", description: "Please select a token and unlock your wallet", variant: "destructive" });
      return;
    }

    const sellAmt = parseFloat(sellAmount);
    const receiveAmt = parseFloat(sellForAmount);
    
    if (isNaN(sellAmt) || sellAmt <= 0 || isNaN(receiveAmt) || receiveAmt <= 0) {
      toast({ title: "Invalid amounts", description: "Please enter valid amounts", variant: "destructive" });
      return;
    }

    if (sellAmt > parseFloat(selectedSellToken.balance)) {
      toast({ title: "Insufficient balance", description: "You don't have enough tokens", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const client = await getClient();
      
      // TakerGets = what the taker (buyer) gets = your RWA tokens
      // TakerPays = what the taker (buyer) pays = XRP or RLUSD
      const takerGets = {
        currency: selectedSellToken.currency,
        issuer: selectedSellToken.issuer,
        value: sellAmount,
      };

      let takerPays: any;
      if (sellForType === "XRP") {
        takerPays = (parseFloat(sellForAmount) * 1000000).toString();
      } else {
        takerPays = {
          currency: RLUSD_CURRENCY,
          issuer: RLUSD_ISSUER,
          value: sellForAmount,
        };
      }

      const offerCreate: any = {
        TransactionType: "OfferCreate",
        Account: wallet.classicAddress,
        TakerGets: takerGets,
        TakerPays: takerPays,
      };

      console.log("Creating sell offer:", offerCreate);

      const prepared = await client.autofill(offerCreate);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      const txResult = result.result as any;
      
      if (txResult.meta?.TransactionResult === "tesSUCCESS") {
        toast({ 
          title: "Sell Offer Created! 🎉", 
          description: `Selling ${sellAmount} ${selectedSellToken.currencyDisplay} for ${sellForAmount} ${sellForType}`,
        });
        setSellAmount("");
        setSellForAmount("");
      } else {
        toast({ 
          title: "Offer Failed", 
          description: txResult.meta?.TransactionResult || "Unknown error",
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Sell offer error:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create offer",
        variant: "destructive" 
      });
    } finally {
      setCreating(false);
    }
  };

  // Create BUY offer (buying RWA with XRP/RLUSD)
  const handleCreateBuyOffer = async () => {
    if (!wallet || !selectedBuyToken) {
      toast({ title: "Error", description: "Please select a token and unlock your wallet", variant: "destructive" });
      return;
    }

    const wantAmt = parseFloat(buyAmount);
    const payAmt = parseFloat(payWithAmount);
    
    if (isNaN(wantAmt) || wantAmt <= 0 || isNaN(payAmt) || payAmt <= 0) {
      toast({ title: "Invalid amounts", description: "Please enter valid amounts", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const client = await getClient();
      
      // For a BUY offer:
      // TakerGets = what the taker (seller) gets = your XRP/RLUSD payment
      // TakerPays = what the taker (seller) pays = the RWA tokens you want
      
      let takerGets: any;
      if (payWithType === "XRP") {
        takerGets = (parseFloat(payWithAmount) * 1000000).toString();
      } else {
        takerGets = {
          currency: RLUSD_CURRENCY,
          issuer: RLUSD_ISSUER,
          value: payWithAmount,
        };
      }

      const takerPays = {
        currency: selectedBuyToken.currency,
        issuer: selectedBuyToken.issuer,
        value: buyAmount,
      };

      const offerCreate: any = {
        TransactionType: "OfferCreate",
        Account: wallet.classicAddress,
        TakerGets: takerGets,
        TakerPays: takerPays,
      };

      console.log("Creating buy offer:", offerCreate);

      const prepared = await client.autofill(offerCreate);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      const txResult = result.result as any;
      
      if (txResult.meta?.TransactionResult === "tesSUCCESS") {
        // Check if the offer was immediately filled
        const offersFilled = txResult.meta?.AffectedNodes?.some((node: any) => 
          node.DeletedNode?.LedgerEntryType === "Offer" ||
          node.ModifiedNode?.LedgerEntryType === "Offer"
        );

        if (offersFilled) {
          toast({ 
            title: "Trade Executed! 🎉", 
            description: `Bought ${buyAmount} ${selectedBuyToken.currencyDisplay} for ${payWithAmount} ${payWithType}`,
          });
        } else {
          toast({ 
            title: "Buy Offer Created! 📋", 
            description: `Offering ${payWithAmount} ${payWithType} for ${buyAmount} ${selectedBuyToken.currencyDisplay}. Waiting for a seller to accept.`,
          });
        }
        setBuyAmount("");
        setPayWithAmount("");
      } else {
        toast({ 
          title: "Offer Failed", 
          description: txResult.meta?.TransactionResult || "Unknown error",
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Buy offer error:", error);
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.push("/rwa")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to RWA Marketplace
      </Button>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Trade RWA Tokens</h1>
        <p className="text-muted-foreground">
          Buy and sell RWA tokens using XRPL's built-in DEX
        </p>
      </div>

      {/* Warning Card */}
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
            <div className="text-sm text-warning">
              <p className="font-semibold mb-1">How It Works</p>
              <p>Your offer is posted to the XRPL order book. If a matching offer exists, 
                 the trade executes instantly. Otherwise, it waits until someone accepts your price.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sell" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Sell Tokens
          </TabsTrigger>
          <TabsTrigger value="buy" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Buy Tokens
          </TabsTrigger>
        </TabsList>

        {/* SELL TAB */}
        <TabsContent value="sell">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-destructive" />
                Create Sell Offer
              </CardTitle>
              <CardDescription>
                Sell your RWA tokens for XRP or RLUSD
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : myTokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Coins className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p>You don't have any RWA tokens to sell.</p>
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
                  {/* What you're selling */}
                  <div className="p-4 bg-destructive/10 rounded-xl space-y-3">
                    <h3 className="font-semibold text-destructive flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      You're Selling
                    </h3>
                    
                    <div>
                      <Label>Select Token</Label>
                      <select 
                        value={sellToken}
                        onChange={(e) => setSellToken(e.target.value)}
                        className="w-full p-2 border rounded-lg mt-1 bg-background"
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
                      />
                      {selectedSellToken && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Available: {parseFloat(selectedSellToken.balance).toLocaleString()} {selectedSellToken.currencyDisplay}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ArrowLeftRight className="w-5 h-5 text-primary" />
                    </div>
                  </div>

                  {/* What you want to receive */}
                  <div className="p-4 bg-success/10 rounded-xl space-y-3">
                    <h3 className="font-semibold text-success flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      You Want to Receive
                    </h3>
                    
                    <div>
                      <Label>Currency</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          type="button"
                          variant={sellForType === "XRP" ? "default" : "outline"}
                          onClick={() => setSellForType("XRP")}
                          className="flex-1"
                        >
                          XRP
                        </Button>
                        <Button
                          type="button"
                          variant={sellForType === "RLUSD" ? "default" : "outline"}
                          onClick={() => setSellForType("RLUSD")}
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
                        value={sellForAmount}
                        onChange={(e) => setSellForAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  {sellAmount && sellForAmount && selectedSellToken && (
                    <div className="p-4 bg-primary/10 rounded-xl">
                      <p className="text-sm text-primary">
                        <strong>Your offer:</strong> Sell {sellAmount} {selectedSellToken.currencyDisplay} for {sellForAmount} {sellForType}
                      </p>
                      <p className="text-xs text-primary/80 mt-1">
                        Rate: 1 {selectedSellToken.currencyDisplay} = {(parseFloat(sellForAmount) / parseFloat(sellAmount)).toFixed(4)} {sellForType}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    onClick={handleCreateSellOffer}
                    disabled={creating || !sellToken || !sellAmount || !sellForAmount}
                    className="w-full"
                    variant="destructive"
                    size="lg"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating Offer...
                      </>
                    ) : (
                      <>
                        <Tag className="w-4 h-4 mr-2" />
                        Create Sell Offer
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BUY TAB */}
        <TabsContent value="buy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Create Buy Offer
              </CardTitle>
              <CardDescription>
                Buy RWA tokens with XRP or RLUSD
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : marketplaceTokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p>No tokens available in marketplace.</p>
                  <p className="text-xs mt-2">Add tokens using "Add Token" in the RWA Marketplace</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push("/rwa")}
                  >
                    Go to Marketplace
                  </Button>
                </div>
              ) : (
                <>
                  {/* What you want to buy */}
                  <div className="p-4 bg-success/10 rounded-xl space-y-3">
                    <h3 className="font-semibold text-success flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      You Want to Buy
                    </h3>
                    
                    <div>
                      <Label>Select Token</Label>
                      <select 
                        value={buyToken}
                        onChange={(e) => setBuyToken(e.target.value)}
                        className="w-full p-2 border rounded-lg mt-1 bg-background"
                      >
                        <option value="">Choose a token...</option>
                        {marketplaceTokens.map((token) => (
                          <option key={`${token.currency}-${token.issuer}`} value={`${token.currency}:${token.issuer}`}>
                            {token.currencyDisplay} (by {token.issuer.slice(0, 8)}...)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Amount to Buy</Label>
                      <Input
                        type="number"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ArrowLeftRight className="w-5 h-5 text-primary" />
                    </div>
                  </div>

                  {/* What you're paying */}
                  <div className="p-4 bg-destructive/10 rounded-xl space-y-3">
                    <h3 className="font-semibold text-destructive flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      You're Paying
                    </h3>
                    
                    <div>
                      <Label>Currency</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          type="button"
                          variant={payWithType === "XRP" ? "default" : "outline"}
                          onClick={() => setPayWithType("XRP")}
                          className="flex-1"
                        >
                          XRP
                        </Button>
                        <Button
                          type="button"
                          variant={payWithType === "RLUSD" ? "default" : "outline"}
                          onClick={() => setPayWithType("RLUSD")}
                          className="flex-1"
                        >
                          RLUSD
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Amount to Pay</Label>
                      <Input
                        type="number"
                        value={payWithAmount}
                        onChange={(e) => setPayWithAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  {buyAmount && payWithAmount && selectedBuyToken && (
                    <div className="p-4 bg-primary/10 rounded-xl">
                      <p className="text-sm text-primary">
                        <strong>Your offer:</strong> Buy {buyAmount} {selectedBuyToken.currencyDisplay} for {payWithAmount} {payWithType}
                      </p>
                      <p className="text-xs text-primary/80 mt-1">
                        Rate: 1 {selectedBuyToken.currencyDisplay} = {(parseFloat(payWithAmount) / parseFloat(buyAmount)).toFixed(4)} {payWithType}
                      </p>
                    </div>
                  )}

                  {/* Important Note */}
                  <div className="p-3 bg-info/10 rounded-lg text-sm text-info">
                    <strong>Note:</strong> You need a trustline to the token before you can receive it.
                    Create one in the RWA Marketplace → Token Details → "Create Trustline".
                  </div>

                  {/* Submit Button */}
                  <Button 
                    onClick={handleCreateBuyOffer}
                    disabled={creating || !buyToken || !buyAmount || !payWithAmount}
                    className="w-full"
                    variant="success"
                    size="lg"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating Offer...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Create Buy Offer
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How DEX Trading Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="font-semibold text-destructive mb-1">🏷️ Seller</p>
              <p className="text-xs text-destructive/80">Posts: "Selling X tokens for Y XRP"</p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg">
              <p className="font-semibold text-success mb-1">🛒 Buyer</p>
              <p className="text-xs text-success/80">Posts: "Buying X tokens for Y XRP"</p>
            </div>
          </div>
          <p className="text-center py-2">⬇️ When prices match ⬇️</p>
          <div className="p-3 bg-primary/10 rounded-lg text-center">
            <p className="font-semibold text-primary">🔄 Atomic Swap!</p>
            <p className="text-xs text-primary/80">Trade executes instantly, no middleman</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
