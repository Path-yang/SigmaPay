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
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
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

    // Validate symbol - prevent XRP and improve validation
    const tokenSymbol = symbol || name.substring(0, 5).toUpperCase();
    if (tokenSymbol.match(/^XRP[A-Z0-9]*$/)) {
      toast({
        title: "Invalid Token Symbol",
        description: "Cannot use 'XRP' as token symbol. XRP is the native currency. Please choose a different symbol.",
        variant: "destructive",
      });
      return;
    }

    // Validate total supply
    const supply = parseFloat(totalSupply);
    if (isNaN(supply) || supply <= 0 || supply > 1000000000) {
      toast({
        title: "Invalid Total Supply",
        description: "Total supply must be a positive number between 1 and 1,000,000,000.",
        variant: "destructive",
      });
      return;
    }

    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    
    try {
      console.log("Starting tokenization:", { name, symbol: tokenSymbol, category, totalSupply });
      
      // Add a timeout wrapper to ensure we don't hang forever
      const tokenizationPromise = issueRWAToken(wallet, tokenSymbol, {
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
      
      // Overall timeout of 180 seconds (2 minutes) to allow for polling
      const overallTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Tokenization process timed out after 3 minutes. The transaction may still be processing. Please check the transaction hash if provided."));
        }, 180000); // 3 minutes
      });
      
      const result = await Promise.race([tokenizationPromise, overallTimeout]);

      console.log("Tokenization result:", result);

      if (result.success) {
        setResultCurrency(result.currency || tokenSymbol);
        setResultHash(result.hash || "");
        setStep("success");
        setLoading(false); // Reset loading before showing success
        
        // Check if we have a hash - if not, transaction might still be pending
        const hasHash = result.hash && result.hash.length > 0;
        if (hasHash) {
          toast({ 
            title: "Asset Tokenized!", 
            description: `Created ${name} (${tokenSymbol}). Transaction confirmed on XRPL.`, 
            variant: "success" 
          });
        } else {
          toast({ 
            title: "Token Submitted!", 
            description: `Token ${name} (${tokenSymbol}) submitted. Waiting for confirmation...`, 
            variant: "default" 
          });
        }
        
        onSuccess?.(result.currency || "", result.hash);
      } else {
        const errorMsg = result.error || "Unknown error occurred";
        console.error("Tokenization failed:", errorMsg);
        setLoading(false); // Reset loading on failure
        setAbortController(null);
        
        // Handle different types of errors with appropriate messaging
        let title = "Tokenization Failed";
        let description = errorMsg;
        let variant: "destructive" | "default" = "destructive";
        let shouldResetForm = false;
        
        if (errorMsg.includes("submitted") && errorMsg.includes("not confirmed")) {
          // Transaction was submitted but not confirmed - this is not necessarily an error
          title = "Transaction Submitted";
          description = errorMsg + "\n\nYou can check your portfolio later or try creating a different token.";
          variant = "default";
          shouldResetForm = true;
        } else if (errorMsg.includes("timeout") || errorMsg.includes("slow")) {
          title = "Network Timeout";
          description = `The transaction timed out. This usually means:\n\n• The testnet is experiencing high load\n• Your transaction may still be processing\n• Try checking your portfolio in a few minutes\n• Ensure you have sufficient XRP (~0.00001 XRP) for fees`;
        } else if (errorMsg.includes("metadata is too large")) {
          title = "Metadata Too Large";
          description = "Please reduce the length of your token description or other fields.";
        } else if (errorMsg.includes("Cannot create XRP")) {
          title = "Invalid Token Symbol";
          description = "Please choose a different token symbol that doesn't start with 'XRP'.";
        } else if (errorMsg.includes("already exists in your portfolio")) {
          title = "Duplicate Token Symbol";
          description = errorMsg + " You can view your existing tokens in the RWA portfolio.";
          shouldResetForm = true;
        } else if (errorMsg.includes("temREDUNDANT") || errorMsg.includes("redundant")) {
          title = "Duplicate Transaction";
          description = "This token creation request is identical to a recent one. Please wait a moment and try again with a different token name, or check your portfolio to see if the token was already created.";
          shouldResetForm = true;
        }
        
        toast({ 
          title, 
          description,
          variant,
          duration: 15000 // Show longer for error messages
        });
        
        if (shouldResetForm) {
          setStep("category");
          resetForm();
        } else {
          // Keep them on the confirm step so they can retry or go back
          setStep("confirm");
        }
      }
    } catch (error) {
      console.error("Tokenization error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to tokenize asset";
      setLoading(false); // Always reset loading in catch block
      setAbortController(null);
      toast({ 
        title: "Error", 
        description: errorMessage,
        variant: "destructive" 
      });
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
            You must verify your identity to tokenize real-world assets. This ensures compliance and builds trust with recipients. Tokens created are recorded on the XRP Ledger and can be transferred globally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-900 mb-2">Verification Options:</h4>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Basic Verification:</strong> Name + Email (allows tokenization)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Full Verification:</strong> Name + Email + Phone (recommended for unlimited features)</span>
              </li>
            </ul>
          </div>
          <Button asChild className="w-full bg-amber-600 hover:bg-amber-700">
            <a href="/verify">Go to Verification Page</a>
          </Button>
          <p className="text-xs text-amber-600 text-center">
            After verification, return here to tokenize your assets
          </p>
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
            <Sparkles className="w-5 h-5 text-primary" />
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
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                >
                  <Icon className="w-6 h-6 text-primary mb-2" />
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
          <div className="flex items-center gap-2 text-sm text-primary mb-2">
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

          <div className="space-y-2">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
              <strong>Note:</strong> This will create an on-chain token on XRP Ledger Testnet. 
              A small XRP fee (~0.00001 XRP) will be charged.
            </div>
            {loading && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <strong>Processing:</strong> Transaction may take 30-120 seconds on testnet. 
                The system will submit the transaction and wait for confirmation. You can cancel if needed.
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                if (loading && abortController) {
                  abortController.abort();
                  setLoading(false);
                  setAbortController(null);
                  toast({ 
                    title: "Cancelled", 
                    description: "Tokenization was cancelled",
                    variant: "default" 
                  });
                } else {
                  setStep("details");
                }
              }} 
              disabled={false} 
              className="flex-1"
            >
              {loading ? "Cancel" : "Back"}
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Token...
                  <span className="ml-2 text-xs opacity-75">(up to 2 min, may retry)</span>
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
            {resultHash 
              ? "Your real-world asset has been successfully tokenized and confirmed on XRPL"
              : "Your token has been submitted and is waiting for confirmation on XRPL"}
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
            {resultHash ? (
              <div className="pt-2 border-t">
                <a 
                  href={`https://testnet.xrpl.org/transactions/${resultHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View on XRPL Explorer →
                </a>
              </div>
            ) : (
              <div className="pt-2 border-t">
                <p className="text-xs text-amber-600">
                  ⚠️ Transaction is still being processed. Your token will appear in your portfolio once confirmed.
                </p>
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

