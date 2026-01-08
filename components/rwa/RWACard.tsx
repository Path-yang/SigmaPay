"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RWAToken, RWACategory } from "@/lib/xrpl/rwa";
import { 
  Building2, 
  Gem, 
  Palette, 
  FileText, 
  GraduationCap,
  Package,
  TrendingUp,
  Send,
  ExternalLink,
  MapPin,
  Calendar,
  User
} from "lucide-react";

interface RWACardProps {
  token: RWAToken;
  onSend?: (token: RWAToken) => void;
  onView?: (token: RWAToken) => void;
  showBalance?: boolean;
  compact?: boolean;
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

export function RWACard({ token, onSend, onView, showBalance = true, compact = false }: RWACardProps) {
  const category = token.metadata?.category || RWACategory.OTHER;
  const config = categoryConfig[category];
  const CategoryIcon = config.icon;

  const formatValue = (value?: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
            <CategoryIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">{token.metadata?.name || token.currencyDisplay}</p>
            <p className="text-xs text-slate-500">{config.label}</p>
          </div>
        </div>
        <div className="text-right">
          {showBalance && (
            <p className="font-bold text-sm">{parseFloat(token.balance).toLocaleString()} {token.currencyDisplay}</p>
          )}
          {token.metadata?.unitValue && (
            <p className="text-xs text-slate-500">{formatValue(token.metadata.unitValue)}/unit</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border-slate-200 hover:border-indigo-300">
      {/* Header with category */}
      <div className={`px-4 py-2 ${config.color} flex items-center gap-2`}>
        <CategoryIcon className="w-4 h-4" />
        <span className="text-sm font-medium">{config.label}</span>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{token.metadata?.name || token.currencyDisplay}</CardTitle>
            <CardDescription className="mt-1">
              <Badge variant="outline" className="font-mono text-xs">
                {token.currencyDisplay}
              </Badge>
            </CardDescription>
          </div>
          {showBalance && parseFloat(token.balance) > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">
                {parseFloat(token.balance).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">units held</p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {token.metadata?.description && (
          <p className="text-sm text-slate-600 line-clamp-2">{token.metadata.description}</p>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {token.metadata?.unitValue && (
            <div className="flex items-center gap-2 text-slate-600">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>{formatValue(token.metadata.unitValue)}/unit</span>
            </div>
          )}
          {token.metadata?.totalSupply && (
            <div className="flex items-center gap-2 text-slate-600">
              <Package className="w-4 h-4 text-blue-500" />
              <span>{parseFloat(token.metadata.totalSupply).toLocaleString()} total</span>
            </div>
          )}
          {token.metadata?.location && (
            <div className="flex items-center gap-2 text-slate-600 col-span-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="truncate">{token.metadata.location}</span>
            </div>
          )}
          {token.metadata?.expirationDate && (
            <div className="flex items-center gap-2 text-slate-600 col-span-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>Expires: {new Date(token.metadata.expirationDate).toLocaleDateString()}</span>
            </div>
          )}
          {token.metadata?.issuerName && (
            <div className="flex items-center gap-2 text-slate-600 col-span-2">
              <User className="w-4 h-4 text-indigo-500" />
              <span className="truncate">{token.metadata.issuerName}</span>
            </div>
          )}
        </div>

        {/* Issuer address */}
        <div className="text-xs text-slate-400 font-mono truncate">
          Issuer: {token.issuer === "demo" ? "Demo Token" : `${token.issuer.substring(0, 8)}...${token.issuer.substring(token.issuer.length - 6)}`}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onSend && parseFloat(token.balance) > 0 && (
            <Button onClick={() => onSend(token)} className="flex-1" size="sm">
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          )}
          {onView && (
            <Button onClick={() => onView(token)} variant="outline" size="sm" className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

