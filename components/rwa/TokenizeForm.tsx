"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/components/wallet/WalletProvider";
import { toast } from "@/components/ui/use-toast";
import { RWACategory, issueRWAToken, canIssueRWA } from "@/lib/xrpl/rwa";
import { VerificationLevel } from "@/lib/xrpl/constants";
import { 
  Loader2, 
  Check, 
  Building2, 
  Gem, 
  Palette, 
  FileText, 
  GraduationCap,
  Package,
  TrendingUp,
  AlertTriangle,
  Sparkles
} from "lucide-react";

interface TokenizeFormProps {
  onSuccess?: (currency: string, hash?: string) => void;
}

const categories = [
  { value: RWACategory.REAL_ESTATE, label: "Real Estate", icon: Building2, description: "Property, land, buildings" },
  { value: RWACategory.COMMODITIES, label: "Commodities", icon: Gem, description: "Gold, silver, oil, etc." },
  { value: RWACategory.ART, label: "Art & Collectibles", icon: Palette, description: "Artwork, rare items" },
  { value: RWACategory.SECURITIES, label: "Securities", icon: TrendingUp, description: "Stocks, bonds" },
  { value: RWACategory.INVOICES, label: "Trade Finance", icon: FileText, description: "Invoices, receivables" },
  { value: RWACategory.CREDENTIALS, label: "Credentials", icon: GraduationCap, description: "Certificates, licenses" },
  { value: RWACategory.OTHER, label: "Other", icon: Package, description: "Other asset types" },
];

export function TokenizeForm({ onSuccess }: TokenizeFormProps) {
  const { wallet, verificationLevel } = useWallet();
  
  const [step, setStep] = useState<"category" | "details" | "confirm" | "success">("category");
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [category, setCategory] = useState<RWACategory | null>(null);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [unitValue, setUnitValue] = useState("");
  const [location, setLocation] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  
  // Result
  const [resultCurrency, setResultCurrency] = useState("");
  const [resultHash, setResultHash] = useState("");

  const isVerified = verificationLevel !== VerificationLevel.UNVERIFIED;

  const handleCategorySelect = (cat: RWACategory) => {
    setCategory(cat);
    setStep("details");
  };

  const handleSubmit = async () => {
    if (!wallet || !category) {
      console.error("Cannot tokenize: missing wallet or category");
      return;
    }

    // Validate symbol - prevent XRP
    const tokenSymbol = symbol || name.substring(0, 5).toUpperCase();
    if (tokenSymbol === "XRP" || tokenSymbol.startsWith("XRP")) {
      toast({
        title: "Invalid Token Symbol",
        description: "Cannot use 'XRP' as token symbol. XRP is the native currency. Please choose a different symbol.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Starting tokenization:", { name, symbol: tokenSymbol, category, totalSupply });
      
      const result = await issueRWAToken(wallet, tokenSymbol, {
        name,
        description,
        category,
        totalSupply,
        unitValue: unitValue || undefined,
        location: location || undefined,
        expirationDate: expirationDate || undefined,
        issuerName: "SigmaPay User",
        createdAt: new Date().toISOString(),
      });

      console.log("Tokenization result:", result);

      if (result.success) {
        setResultCurrency(result.currency || tokenSymbol);
        setResultHash(result.hash || "");
        setStep("success");
        toast({ title: "Asset Tokenized!", description: `Created ${name} (${tokenSymbol})`, variant: "success" });
        onSuccess?.(result.currency || "", result.hash);
      } else {
        const errorMsg = result.error || "Unknown error occurred";
        console.error("Tokenization failed:", errorMsg);
        toast({ 
          title: "Tokenization Failed", 
          description: errorMsg,
          variant: "destructive" 
        });
        // Reset loading state on failure
        setLoading(false);
      }
    } catch (error) {
      console.error("Tokenization error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to tokenize asset";
      toast({ 
        title: "Error", 
        description: errorMessage,
        variant: "destructive" 
      });
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("category");
    setCategory(null);
    setName("");
    setSymbol("");
    setDescription("");
    setTotalSupply("");
    setUnitValue("");
    setLocation("");
    setExpirationDate("");
  };

  // Check verification
  if (!isVerified) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
            Verification Required
          </CardTitle>
          <CardDescription className="text-amber-700">
            You must verify your identity to tokenize real-world assets. This ensures compliance and builds trust.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <a href="/verify">Verify Identity</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Step 1: Category Selection
  if (step === "category") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Tokenize an Asset
          </CardTitle>
          <CardDescription>
            Select the type of real-world asset you want to tokenize
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => handleCategorySelect(cat.value)}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left"
                >
                  <Icon className="w-6 h-6 text-indigo-600 mb-2" />
                  <p className="font-semibold text-sm">{cat.label}</p>
                  <p className="text-xs text-slate-500">{cat.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Details Form
  if (step === "details") {
    const selectedCategory = categories.find(c => c.value === category);
    const CategoryIcon = selectedCategory?.icon || Package;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-indigo-600 mb-2">
            <CategoryIcon className="w-4 h-4" />
            <span>{selectedCategory?.label}</span>
          </div>
          <CardTitle>Asset Details</CardTitle>
          <CardDescription>
            Provide information about the asset you&apos;re tokenizing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Manhattan Apartment Share"
              />
            </div>

            <div>
              <Label htmlFor="symbol">Token Symbol *</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => {
                  let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 8);
                  // Prevent XRP
                  if (value === "XRP" || value.startsWith("XRP")) {
                    value = value.replace(/^XRP/, "");
                  }
                  setSymbol(value);
                }}
                placeholder="e.g., MAPT1"
                maxLength={8}
              />
              <p className="text-xs text-slate-500 mt-1">3-8 characters (cannot be XRP)</p>
            </div>

            <div>
              <Label htmlFor="totalSupply">Total Supply *</Label>
              <Input
                id="totalSupply"
                type="number"
                value={totalSupply}
                onChange={(e) => setTotalSupply(e.target.value)}
                placeholder="e.g., 1000"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the asset, its value proposition, and any relevant details..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="unitValue">Value per Unit (USD)</Label>
              <Input
                id="unitValue"
                type="number"
                value={unitValue}
                onChange={(e) => setUnitValue(e.target.value)}
                placeholder="e.g., 500"
              />
            </div>

            {(category === RWACategory.REAL_ESTATE || category === RWACategory.COMMODITIES) && (
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., New York, NY"
                />
              </div>
            )}

            {(category === RWACategory.INVOICES || category === RWACategory.CREDENTIALS) && (
              <div>
                <Label htmlFor="expiration">Expiration Date</Label>
                <Input
                  id="expiration"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setStep("category")} className="flex-1">
              Back
            </Button>
            <Button 
              onClick={() => setStep("confirm")} 
              disabled={!name || !symbol || !totalSupply || !description}
              className="flex-1"
            >
              Review
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Confirmation
  if (step === "confirm") {
    const selectedCategory = categories.find(c => c.value === category);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirm Tokenization</CardTitle>
          <CardDescription>
            Review your asset details before creating the token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Asset Name</span>
              <span className="font-semibold">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Symbol</span>
              <span className="font-mono font-semibold">{symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Category</span>
              <span>{selectedCategory?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Supply</span>
              <span>{parseFloat(totalSupply).toLocaleString()} units</span>
            </div>
            {unitValue && (
              <div className="flex justify-between">
                <span className="text-slate-600">Unit Value</span>
                <span>${parseFloat(unitValue).toLocaleString()}</span>
              </div>
            )}
            {location && (
              <div className="flex justify-between">
                <span className="text-slate-600">Location</span>
                <span>{location}</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700">
            <strong>Note:</strong> This will create an on-chain token on XRP Ledger Testnet. 
            A small XRP fee (~0.00001 XRP) will be charged.
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep("details")} disabled={loading} className="flex-1">
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Token
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 4: Success
  if (step === "success") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Asset Tokenized! 🎉</CardTitle>
          <CardDescription className="text-green-700">
            Your real-world asset has been successfully tokenized on XRPL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white rounded-xl space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Token</span>
              <span className="font-semibold">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Symbol</span>
              <span className="font-mono">{resultCurrency}</span>
            </div>
            {resultHash && (
              <div className="pt-2 border-t">
                <a 
                  href={`https://testnet.xrpl.org/transactions/${resultHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  View on XRPL Explorer →
                </a>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={resetForm} className="flex-1">
              Create Another
            </Button>
            <Button asChild className="flex-1">
              <a href="/rwa">View My Assets</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

