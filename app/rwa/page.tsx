"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import { Navbar } from "@/components/common/Navbar";
import { RWACard } from "@/components/rwa/RWACard";
import { SendRWAForm } from "@/components/rwa/SendRWAForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getRWATokens, getAllMarketplaceTokens, RWAToken, DEMO_RWA_TOKENS } from "@/lib/xrpl/rwa";
import { 
  Loader2, 
  Plus, 
  Briefcase, 
  Store, 
  Globe,
  TrendingUp,
  Package,
  Sparkles
} from "lucide-react";

export default function RWAPage() {
  const router = useRouter();
  const { wallet, address, isLoading: walletLoading, hasWallet } = useWallet();

  const [myTokens, setMyTokens] = useState<RWAToken[]>([]);
  const [marketplaceTokens, setMarketplaceTokens] = useState<RWAToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<RWAToken | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);

  useEffect(() => {
    if (!walletLoading && !hasWallet) {
      router.push("/onboarding");
    }
  }, [walletLoading, hasWallet, router]);

  useEffect(() => {
    async function loadTokens() {
      if (!address) return;
      
      setLoading(true);
      try {
        // Get user's RWA tokens
        const tokens = await getRWATokens(address);
        setMyTokens(tokens);

        // Get marketplace tokens (all issued tokens)
        const marketplace = getAllMarketplaceTokens();
        // Add demo tokens if marketplace is empty
        setMarketplaceTokens(marketplace.length > 0 ? marketplace : DEMO_RWA_TOKENS);
      } catch (error) {
        console.error("Failed to load RWA tokens:", error);
        setMarketplaceTokens(DEMO_RWA_TOKENS);
      } finally {
        setLoading(false);
      }
    }

    loadTokens();
  }, [address]);

  const handleSend = (token: RWAToken) => {
    setSelectedToken(token);
    setShowSendDialog(true);
  };

  const handleSendSuccess = () => {
    setShowSendDialog(false);
    setSelectedToken(null);
    // Refresh tokens
    if (address) {
      getRWATokens(address).then(setMyTokens);
    }
  };

  if (walletLoading || !wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Calculate portfolio stats
  const totalValue = myTokens.reduce((sum, token) => {
    const balance = parseFloat(token.balance);
    const unitValue = parseFloat(token.metadata?.unitValue || "0");
    return sum + (balance * unitValue);
  }, 0);

  const totalAssets = myTokens.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">RWA Marketplace</h1>
            <p className="text-slate-600 text-sm">Tokenize and trade real-world assets globally</p>
          </div>
          <Button onClick={() => router.push("/tokenize")}>
            <Plus className="w-4 h-4 mr-2" />
            Tokenize Asset
          </Button>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-indigo-100 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Portfolio Value
              </div>
              <p className="text-2xl font-bold">
                ${totalValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Briefcase className="w-4 h-4" />
                My Assets
              </div>
              <p className="text-2xl font-bold text-slate-800">{totalAssets}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Store className="w-4 h-4" />
                Marketplace
              </div>
              <p className="text-2xl font-bold text-slate-800">{marketplaceTokens.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-assets" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-assets" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              My Assets
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Marketplace
            </TabsTrigger>
          </TabsList>

          {/* My Assets Tab */}
          <TabsContent value="my-assets" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : myTokens.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {myTokens.map((token, idx) => (
                  <RWACard
                    key={`${token.currency}-${token.issuer}-${idx}`}
                    token={token}
                    onSend={handleSend}
                    showBalance={true}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-700 mb-2">No RWA Tokens Yet</h3>
                  <p className="text-slate-500 text-sm mb-4">
                    Start by tokenizing a real-world asset or receiving tokens from others
                  </p>
                  <Button onClick={() => router.push("/tokenize")}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Tokenize Your First Asset
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-4">
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-8 h-8 text-amber-600" />
                  <div>
                    <h3 className="font-semibold text-amber-800">Global RWA Exchange</h3>
                    <p className="text-sm text-amber-700">
                      Browse tokenized real-world assets from issuers worldwide
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {marketplaceTokens.map((token, idx) => (
                <RWACard
                  key={`${token.currency}-${token.issuer}-${idx}`}
                  token={token}
                  showBalance={false}
                  onView={(t) => {
                    // Show token details
                    setSelectedToken(t);
                  }}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Send RWA Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {selectedToken && (
            <SendRWAForm
              token={selectedToken}
              onSuccess={handleSendSuccess}
              onCancel={() => setShowSendDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

