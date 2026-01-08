"use client";

import { useRouter } from "next/navigation";
import { TokenizeForm } from "@/components/rwa/TokenizeForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Shield, 
  Globe, 
  Zap, 
  Lock,
  Info
} from "lucide-react";

export default function TokenizePage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Info Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Tokenize Real-World Assets</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Create blockchain-backed tokens representing physical assets on the XRP Ledger.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Global Access</p>
            <p className="text-xs text-muted-foreground">Send anywhere</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 text-chart-4 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Instant</p>
            <p className="text-xs text-muted-foreground">3-5 seconds</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Lock className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Secure</p>
            <p className="text-xs text-muted-foreground">On-chain proof</p>
          </CardContent>
        </Card>
      </div>

      {/* Tokenize Form */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
          <CardDescription>Enter the details of the asset you want to tokenize</CardDescription>
        </CardHeader>
        <CardContent>
          <TokenizeForm 
            onSuccess={(currency, hash) => {
              console.log("Tokenized:", currency, hash);
              setTimeout(() => {
                router.push("/rwa");
              }, 1500);
            }}
          />
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-1">Verification Required</p>
              <p className="text-muted-foreground">
                To tokenize assets, you must verify your identity. This ensures compliance 
                and builds trust with recipients. Tokens created are recorded on the 
                XRP Ledger and can be transferred globally.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
