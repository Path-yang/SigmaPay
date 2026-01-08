"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/WalletProvider";
import { Navbar } from "@/components/common/Navbar";
import { TokenizeForm } from "@/components/rwa/TokenizeForm";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  Shield, 
  Globe, 
  Zap, 
  Lock,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TokenizePage() {
  const router = useRouter();
  const { wallet, isLoading: walletLoading, hasWallet } = useWallet();

  useEffect(() => {
    if (!walletLoading && !hasWallet) {
      router.push("/onboarding");
    }
  }, [walletLoading, hasWallet, router]);

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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Tokenize Real-World Assets</h1>
          <p className="text-slate-600">
            Create blockchain-backed tokens representing physical assets
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-4">
              <Globe className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Global Access</p>
              <p className="text-xs text-slate-500">Send anywhere</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-4">
              <Zap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Instant</p>
              <p className="text-xs text-slate-500">3-5 seconds</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-4">
              <Lock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Secure</p>
              <p className="text-xs text-slate-500">On-chain proof</p>
            </CardContent>
          </Card>
        </div>

        {/* Tokenize Form */}
        <TokenizeForm 
          onSuccess={(currency, hash) => {
            console.log("Tokenized:", currency, hash);
          }}
        />

        {/* Info Section */}
        <Card className="mt-8 bg-indigo-50 border-indigo-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-indigo-800 mb-1">
                  Verification Required
                </p>
                <p className="text-indigo-700">
                  To tokenize assets, you must verify your identity. This ensures compliance 
                  and builds trust with recipients. Tokens created are recorded on the 
                  XRP Ledger and can be transferred globally.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

