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
import { getRWATokens, getAllMarketplaceTokens, RWAToken, DEMO_RWA_TOKENS, RWACategory } from "@/lib/xrpl/rwa";
import { TokenDetailsModal } from "@/components/rwa/TokenDetailsModal";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Plus, 
  Briefcase, 
  Store, 
  Globe,
  TrendingUp,
  Package,
  Sparkles,
  Search,
  Filter,
  ArrowUpDown
} from "lucide-react";

export default function RWAPage() {
  const router = useRouter();
  const { wallet, address, isLoading: walletLoading, hasWallet } = useWallet();

  const [myTokens, setMyTokens] = useState<RWAToken[]>([]);
  const [marketplaceTokens, setMarketplaceTokens] = useState<RWAToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<RWAToken | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Marketplace filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<RWACategory | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "value" | "supply" | "newest">("newest");

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
        console.log("[RWA Page] Loaded tokens:", tokens);
        setMyTokens(tokens);

        // Get marketplace tokens (all issued tokens)
        const marketplace = getAllMarketplaceTokens();
        console.log("[RWA Page] Marketplace tokens:", marketplace);
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
    
    // Refresh tokens when page becomes visible (e.g., returning from tokenize page)
    const handleVisibilityChange = () => {
      if (!document.hidden && address) {
        loadTokens();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [address]);

  const handleSend = (token: RWAToken) => {
    setSelectedToken(token);
    setShowSendDialog(true);
  };

  const handleSendSuccess = () => {
    setShowSendDialog(false);
    setSelectedToken(null);
    // Refresh tokens after a short delay to allow ledger to update
    if (address) {
      setTimeout(() => {
        getRWATokens(address).then(setMyTokens).catch(console.error);
      }, 2000);
    }
  };

  const handleViewDetails = (token: RWAToken) => {
    setSelectedToken(token);
    setShowDetailsDialog(true);
  };

  // Filter and sort marketplace tokens
  const filteredMarketplaceTokens = marketplaceTokens
    .filter((token) => {
      // Search filter
      const matchesSearch = 
        !searchQuery ||
        token.metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.currencyDisplay.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = 
        selectedCategory === "all" || 
        token.metadata?.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.metadata?.name || a.currencyDisplay).localeCompare(b.metadata?.name || b.currencyDisplay);
        case "value":
          const aValue = parseFloat(a.metadata?.unitValue || "0") * parseFloat(a.metadata?.totalSupply || "0");
          const bValue = parseFloat(b.metadata?.unitValue || "0") * parseFloat(b.metadata?.totalSupply || "0");
          return bValue - aValue;
        case "supply":
          return parseFloat(b.metadata?.totalSupply || "0") - parseFloat(a.metadata?.totalSupply || "0");
        case "newest":
        default:
          const aDate = a.metadata?.createdAt ? new Date(a.metadata.createdAt).getTime() : 0;
          const bDate = b.metadata?.createdAt ? new Date(b.metadata.createdAt).getTime() : 0;
          return bDate - aDate;
      }
    });

  if (walletLoading || !wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Calculate portfolio stats
  const totalValue = myTokens.reduce((sum, token) => {
    const balance = parseFloat(token.balance || "0");
    const unitValue = parseFloat(token.metadata?.unitValue || "0");
    const value = balance * unitValue;
    console.log(`[Portfolio] Token ${token.currencyDisplay}: balance=${balance}, unitValue=${unitValue}, value=${value}`);
    return sum + value;
  }, 0);
  
  console.log(`[Portfolio] Total value: ${totalValue}, Total assets: ${myTokens.length}`);

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

            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search tokens by name, symbol, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Category:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory("all")}
                      >
                        All
                      </Button>
                      <Button
                        variant={selectedCategory === RWACategory.REAL_ESTATE ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(RWACategory.REAL_ESTATE)}
                      >
                        Real Estate
                      </Button>
                      <Button
                        variant={selectedCategory === RWACategory.COMMODITIES ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(RWACategory.COMMODITIES)}
                      >
                        Commodities
                      </Button>
                      <Button
                        variant={selectedCategory === RWACategory.ART ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(RWACategory.ART)}
                      >
                        Art
                      </Button>
                      <Button
                        variant={selectedCategory === RWACategory.SECURITIES ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(RWACategory.SECURITIES)}
                      >
                        Securities
                      </Button>
                      <Button
                        variant={selectedCategory === RWACategory.INVOICES ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(RWACategory.INVOICES)}
                      >
                        Trade Finance
                      </Button>
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Sort by:</span>
                    <div className="flex gap-2">
                      <Button
                        variant={sortBy === "newest" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSortBy("newest")}
                      >
                        Newest
                      </Button>
                      <Button
                        variant={sortBy === "name" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSortBy("name")}
                      >
                        Name
                      </Button>
                      <Button
                        variant={sortBy === "value" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSortBy("value")}
                      >
                        Value
                      </Button>
                      <Button
                        variant={sortBy === "supply" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSortBy("supply")}
                      >
                        Supply
                      </Button>
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="text-sm text-slate-500">
                    Showing {filteredMarketplaceTokens.length} of {marketplaceTokens.length} tokens
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Token Grid */}
            {filteredMarketplaceTokens.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMarketplaceTokens.map((token, idx) => (
                  <RWACard
                    key={`${token.currency}-${token.issuer}-${idx}`}
                    token={token}
                    showBalance={false}
                    onView={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-700 mb-2">No Tokens Found</h3>
                  <p className="text-slate-500 text-sm">
                    {searchQuery || selectedCategory !== "all"
                      ? "Try adjusting your search or filters"
                      : "No tokens available in the marketplace yet"}
                  </p>
                </CardContent>
              </Card>
            )}
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

      {/* Token Details Dialog */}
      {selectedToken && (
        <TokenDetailsModal
          token={selectedToken}
          open={showDetailsDialog}
          onClose={() => {
            setShowDetailsDialog(false);
            setSelectedToken(null);
          }}
          onTrustlineCreated={() => {
            // Refresh tokens after trustline creation
            if (address) {
              setTimeout(() => {
                getRWATokens(address).then(setMyTokens).catch(console.error);
              }, 2000);
            }
          }}
        />
      )}
    </div>
  );
}

