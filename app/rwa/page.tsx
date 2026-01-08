"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import { RWACard } from "@/components/rwa/RWACard";
import { SendRWAForm } from "@/components/rwa/SendRWAForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getRWATokens, getAllMarketplaceTokens, RWAToken, DEMO_RWA_TOKENS, RWACategory, currencyFromXRPL } from "@/lib/xrpl/rwa";
import { TokenDetailsModal } from "@/components/rwa/TokenDetailsModal";
import { AddTokenDialog } from "@/components/rwa/AddTokenDialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
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
  ArrowUpDown,
  ArrowLeftRight
} from "lucide-react";

export default function RWAPage() {
  const router = useRouter();
  const { address } = useWallet();

  const [myTokens, setMyTokens] = useState<RWAToken[]>([]);
  const [marketplaceTokens, setMarketplaceTokens] = useState<RWAToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<RWAToken | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddTokenDialog, setShowAddTokenDialog] = useState(false);
  
  // Marketplace filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<RWACategory | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "value" | "supply" | "newest">("newest");

  useEffect(() => {
    async function loadTokens() {
      if (!address) return;
      
      setLoading(true);
      try {
        const tokens = await getRWATokens(address);
        setMyTokens(tokens);

        let marketplace = getAllMarketplaceTokens();
        
        const urlParams = new URLSearchParams(window.location.search);
        const tokenCurrency = urlParams.get('token');
        const tokenIssuer = urlParams.get('issuer');
        
        if (tokenCurrency && tokenIssuer) {
          toast({
            title: "Shared Token Detected! 🎯",
            description: `Found "${currencyFromXRPL(tokenCurrency)}" token shared with you.`,
            duration: 8000,
          });
          
          try {
            const { fetchTokenMetadataFromLedger } = await import("@/lib/xrpl/rwa");
            const detailedToken = await fetchTokenMetadataFromLedger(tokenCurrency, tokenIssuer);
            
            if (detailedToken) {
              marketplace = marketplace.map(token => 
                token.currency === tokenCurrency && token.issuer === tokenIssuer 
                  ? detailedToken 
                  : token
              );
            }
          } catch (error) {
            console.error("Failed to fetch token metadata:", error);
          }
        }
        
        const finalMarketplace = marketplace.length > 0 ? marketplace : DEMO_RWA_TOKENS;
        setMarketplaceTokens(finalMarketplace);
        
      } catch (error) {
        console.error("Failed to load RWA tokens:", error);
        setMarketplaceTokens(DEMO_RWA_TOKENS);
        setMyTokens([]);
      } finally {
        setLoading(false);
      }
    }

    loadTokens();
    
    const handleVisibilityChange = () => {
      if (!document.hidden && address) {
        loadTokens();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [address]);

  const handleSend = (token: RWAToken) => {
    setSelectedToken(token);
    setShowSendDialog(true);
  };

  const handleSendSuccess = () => {
    setShowSendDialog(false);
    setSelectedToken(null);
    
    setTimeout(() => {
      if (address) {
        getRWATokens(address).then(setMyTokens).catch(console.error);
      }
    }, 2000);
  };

  const handleViewDetails = (token: RWAToken) => {
    setSelectedToken(token);
    setShowDetailsDialog(true);
  };

  const filteredMarketplaceTokens = marketplaceTokens
    .filter((token) => {
      const matchesSearch = 
        !searchQuery ||
        token.metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.currencyDisplay.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
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

  const totalValue = myTokens.reduce((sum, token) => {
    const balance = parseFloat(token.balance || "0");
    const unitValue = parseFloat(token.metadata?.unitValue || "0");
    return sum + balance * unitValue;
  }, 0);

  const totalAssets = myTokens.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Tokenize and trade real-world assets globally</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddTokenDialog(true)}>
            <Search className="w-4 h-4 mr-2" />
            Add Token
          </Button>
          <Button variant="outline" onClick={() => router.push("/trade")}>
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Trade
          </Button>
          <Button onClick={() => router.push("/tokenize")}>
            <Plus className="w-4 h-4 mr-2" />
            Tokenize Asset
          </Button>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 opacity-80 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Portfolio Value
            </div>
            <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Briefcase className="w-4 h-4" />
              My Assets
            </div>
            <p className="text-2xl font-bold text-foreground">{totalAssets}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Store className="w-4 h-4" />
              Marketplace
            </div>
            <p className="text-2xl font-bold text-foreground">{marketplaceTokens.length}</p>
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
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No RWA Tokens Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
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
          <Card className="bg-chart-4/5 border-chart-4/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-chart-4" />
                <div>
                  <h3 className="font-semibold text-foreground">Global RWA Exchange</h3>
                  <p className="text-sm text-muted-foreground">
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search tokens by name, symbol, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Category:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["all", RWACategory.REAL_ESTATE, RWACategory.COMMODITIES, RWACategory.ART, RWACategory.SECURITIES, RWACategory.INVOICES].map((cat) => (
                      <Button
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(cat as RWACategory | "all")}
                      >
                        {cat === "all" ? "All" : cat === RWACategory.INVOICES ? "Trade Finance" : cat.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Sort by:</span>
                  <div className="flex gap-2">
                    {(["newest", "name", "value", "supply"] as const).map((sort) => (
                      <Button
                        key={sort}
                        variant={sortBy === sort ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSortBy(sort)}
                      >
                        {sort.charAt(0).toUpperCase() + sort.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
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
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No Tokens Found</h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery || selectedCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "No tokens available in the marketplace yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
            if (address) {
              setTimeout(() => {
                getRWATokens(address).then(setMyTokens).catch(console.error);
              }, 2000);
            }
          }}
          onTokenRemoved={() => {
            // Refresh marketplace tokens after removal
            const updatedMarketplace = getAllMarketplaceTokens();
            setMarketplaceTokens(updatedMarketplace.length > 0 ? updatedMarketplace : DEMO_RWA_TOKENS);
          }}
        />
      )}

      {/* Add Token Dialog */}
      <AddTokenDialog
        open={showAddTokenDialog}
        onClose={() => setShowAddTokenDialog(false)}
        onTokenAdded={() => {
          const updatedMarketplace = getAllMarketplaceTokens();
          setMarketplaceTokens(updatedMarketplace.length > 0 ? updatedMarketplace : DEMO_RWA_TOKENS);
        }}
      />
    </div>
  );
}
