"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerificationLevel, LIMITS, getLimitDisplay } from "@/lib/xrpl/constants";
import { ShieldCheck, Shield, ArrowRight, Loader2 } from "lucide-react";

interface VerificationPromptProps {
  currentLevel: VerificationLevel;
  onVerify: (level: VerificationLevel, data: { name: string; email: string; phone?: string }) => Promise<void>;
  requiredAmount?: number;
  onCancel?: () => void;
}

export function VerificationPrompt({ 
  currentLevel, 
  onVerify, 
  requiredAmount,
  onCancel 
}: VerificationPromptProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyType, setVerifyType] = useState<"basic" | "full" | null>(null);

  const currentLimit = LIMITS[currentLevel];
  
  const handleBasicVerify = async () => {
    if (!name || !email) return;
    setLoading(true);
    setVerifyType("basic");
    try {
      await onVerify(VerificationLevel.BASIC, { name, email });
    } finally {
      setLoading(false);
      setVerifyType(null);
    }
  };

  const handleFullVerify = async () => {
    if (!name || !email || !phone) return;
    setLoading(true);
    setVerifyType("full");
    try {
      await onVerify(VerificationLevel.VERIFIED, { name, email, phone });
    } finally {
      setLoading(false);
      setVerifyType(null);
    }
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <ShieldCheck className="w-5 h-5" />
          Verify Your Identity
        </CardTitle>
        <CardDescription className="text-amber-700">
          {requiredAmount 
            ? `You're trying to send $${requiredAmount.toLocaleString()}, but your current limit is ${getLimitDisplay(currentLevel)}.`
            : `Your current limit is ${getLimitDisplay(currentLevel)}. Verify to unlock higher limits and instant transfers.`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div>
            <Label htmlFor="name" className="text-slate-700">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="bg-white"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-slate-700">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="bg-white"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-slate-700">
              Phone Number <span className="text-slate-400">(for full verification)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+65 1234 5678"
              className="bg-white"
              disabled={loading}
            />
          </div>
        </div>

        {/* Verification tiers */}
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={handleBasicVerify}
            disabled={!name || !email || loading}
            className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Basic</span>
            </div>
            <p className="text-sm text-blue-700 mb-2">$1,000 limit • Direct payments</p>
            {loading && verifyType === "basic" ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <ArrowRight className="w-4 h-4 text-blue-600" />
            )}
          </button>

          <button
            onClick={handleFullVerify}
            disabled={!name || !email || !phone || loading}
            className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-emerald-800">Full</span>
            </div>
            <p className="text-sm text-emerald-700 mb-2">Unlimited • Instant transfers</p>
            {loading && verifyType === "full" ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            )}
          </button>
        </div>

        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="w-full" disabled={loading}>
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

