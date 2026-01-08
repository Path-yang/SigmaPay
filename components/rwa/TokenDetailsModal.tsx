"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RWAToken, RWACategory, createRWATrustline } from "@/lib/xrpl/rwa";
import { useWallet } from "@/components/wallet/WalletProvider";
import { toast } from "@/components/ui/use-toast";
import { getExplorerAccountLink } from "@/lib/xrpl/constants";
import { 
  Building2, 
  Gem, 
  Palette, 
  FileText, 
  GraduationCap,
  Package,
  TrendingUp,
  MapPin,
  Calendar,
  User,
  ExternalLink,
  CheckCircle,
  Loader2,
  Shield,
  Globe
} from "lucide-react";

interface TokenDetailsModalProps {
  token: RWAToken;
  open: boolean;
  onClose: () => void;
  onTrustlineCreated?: () => void;
}

const categoryConfig: Record<RWACategory, { icon: typeof Building2; color: string; label: string }> = {
  [RWACategory.REAL_ESTATE]: { icon: Building2, color: "bg-blue-100 text-blue-700", label: "Real Estate" },
  [RWACategory.COMMODITIES]: { icon: Gem, color: "bg-amber-100 text-amber-700", label: "Commodities" },
  [RWACategory.ART]: { icon: Palette, color: "bg-purple-100 text-purple-700", label: "Art" },
  [RWACategory.SECURITIES]: { icon: TrendingUp, color: "bg-green-100 text-green-700", label: "Securities" },
  [RWACategory.INVOICES]: { icon: FileText, color: "bg-orange-100 text-orange-700", label: "Invoices" },
  [RWACategory.COLLECTIBLES]: { icon: Package, color: "bg-pink-100 text-pink-700", label: "Collectibles" },
  [RWACategory.CREDENTIALS]: { icon: GraduationCap, color: "bg-indigo-100 text-indigo-700", label: "Credentials" },
  [RWACategory.OTHER]: { icon: Package, color: "bg-gray-100 text-gray-700", label: "Other" },
};

export function TokenDetailsModal({ token, open, onClose, onTrustlineCreated }: TokenDetailsModalProps) {
  const { wallet, address } = useWallet();
  const [creatingTrustline, setCreatingTrustline] = useState(false);
  const [hasTrustline, setHasTrustline] = useState(false);

  const category = token.metadata?.category || RWACategory.OTHER;
  const config = categoryConfig[category];
  const CategoryIcon = config.icon;

  const formatValue = (value?: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  };

  const handleCreateTrustline = async () => {
    if (!wallet || token.issuer === "demo") {
      toast({
        title: "Cannot Create Trustline",
        description: "Demo tokens don't require trustlines. Contact the issuer to receive real tokens.",
        variant: "destructive",
      });
      return;
    }

    setCreatingTrustline(true);
    try {
      const result = await createRWATrustline(
        wallet,
        token.currency,
        token.issuer,
        token.metadata?.totalSupply || "1000000000"
      );

      if (result.success) {
        setHasTrustline(true);
        toast({
          title: "Trustline Created!",
          description: "You can now receive this token. Ask the issuer to send you tokens.",
          variant: "success",
        });
        onTrustlineCreated?.();
      } else {
        toast({
          title: "Failed to Create Trustline",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create trustline",
        variant: "destructive",
      });
    } finally {
      setCreatingTrustline(false);
    }
  };

  const isOwnToken = address === token.issuer;
  const totalValue = token.metadata?.totalSupply && token.metadata?.unitValue
    ? parseFloat(token.metadata.totalSupply) * parseFloat(token.metadata.unitValue)
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${config.color}`}>
              <CategoryIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{token.metadata?.name || token.currencyDisplay}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-mono">{token.currencyDisplay}</Badge>
                <Badge className={config.color}>{config.label}</Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          {token.metadata?.description && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-slate-700">{token.metadata.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {token.metadata?.totalSupply && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-500 mb-1">Total Supply</p>
                  <p className="text-xl font-bold">{parseFloat(token.metadata.totalSupply).toLocaleString()}</p>
                </CardContent>
              </Card>
            )}
            {token.metadata?.unitValue && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-500 mb-1">Unit Value</p>
                  <p className="text-xl font-bold">{formatValue(token.metadata.unitValue)}</p>
                </CardContent>
              </Card>
            )}
            {totalValue && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-500 mb-1">Total Value</p>
                  <p className="text-xl font-bold">{formatValue(totalValue.toString())}</p>
                </CardContent>
              </Card>
            )}
            {token.balance && parseFloat(token.balance) > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-500 mb-1">Your Balance</p>
                  <p className="text-xl font-bold text-indigo-600">{parseFloat(token.balance).toLocaleString()}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asset Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {token.metadata?.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Location</p>
                    <p className="text-slate-600">{token.metadata.location}</p>
                  </div>
                </div>
              )}
              {token.metadata?.expirationDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Expiration Date</p>
                    <p className="text-slate-600">{new Date(token.metadata.expirationDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              {token.metadata?.issuerName && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Issuer</p>
                    <p className="text-slate-600">{token.metadata.issuerName}</p>
                  </div>
                </div>
              )}
              {token.metadata?.createdAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Created</p>
                    <p className="text-slate-600">{new Date(token.metadata.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issuer Information */}
          {token.issuer !== "demo" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Issuer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm text-slate-600">
                    {token.issuer.substring(0, 12)}...{token.issuer.substring(token.issuer.length - 8)}
                  </div>
                  <a
                    href={getExplorerAccountLink(token.issuer)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-sm flex items-center gap-1"
                  >
                    View on Explorer
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {!isOwnToken && (
            <Card className="border-indigo-200 bg-indigo-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  Receive This Token
                </CardTitle>
                <CardDescription>
                  Create a trustline to receive this token from the issuer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasTrustline ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>Trustline created! You can now receive this token.</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleCreateTrustline}
                    disabled={creatingTrustline || !wallet || token.issuer === "demo"}
                    className="w-full"
                  >
                    {creatingTrustline ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating Trustline...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Create Trustline
                      </>
                    )}
                  </Button>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  A small XRP fee (~0.00001 XRP) will be charged to create the trustline.
                </p>
              </CardContent>
            </Card>
          )}

          {isOwnToken && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">You are the issuer of this token</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
