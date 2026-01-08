"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { XRPPriceChart } from "@/components/dashboard/XRPPriceChart";
import { DIDStatus } from "@/components/did/DIDStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getLimitDisplay } from "@/lib/xrpl/constants";
import { formatAmount } from "@/lib/utils/format";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { 
  ArrowRight, 
  Shield, 
  ShieldCheck, 
  Zap,
  DollarSign,
  RefreshCw,
  Loader2
} from "lucide-react";

export default function DashboardPage() {
  const { 
    verificationLevel,
    isVerified,
    balances,
    isLoading,
    hasTrustline,
    isFunded,
    refreshBalances,
    fundWallet,
    setupTrustline,
  } = useWallet();

  const [isFunding, setIsFunding] = useState(false);
  const [isSettingTrustline, setIsSettingTrustline] = useState(false);

  const handleFundWallet = async () => {
    setIsFunding(true);
    const success = await fundWallet();
    setIsFunding(false);

    if (success) {
      toast({
        title: "Wallet funded!",
        description: "Your wallet has been funded with test XRP",
        variant: "success",
      });
    } else {
      toast({
        title: "Funding failed",
        description: "Please try again in a few moments",
        variant: "destructive",
      });
    }
  };

  const handleSetupTrustline = async () => {
    setIsSettingTrustline(true);
    const success = await setupTrustline();
    setIsSettingTrustline(false);

    if (success) {
      toast({
        title: "RLUSD Enabled!",
        description: "You can now send and receive RLUSD stablecoin",
        variant: "success",
      });
    } else {
      toast({
        title: "Setup failed",
        description: "Please try again in a few moments",
        variant: "destructive",
      });
    }
  };

  const xrpBalance = parseFloat(balances.xrp) || 0;
  const rlusdBalance = parseFloat(balances.rlusd) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Fund Wallet Prompt for New Accounts */}
      {!isFunded && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Welcome! Fund Your Wallet</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Get started by funding your wallet with free test XRP from the testnet faucet.
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={handleFundWallet}
                disabled={isFunding}
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                {isFunding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Funding...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Fund Wallet
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Prompt for Unverified Users */}
      {isFunded && !isVerified && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Verify Your Identity</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your current limit is {getLimitDisplay(verificationLevel)}. Verify to unlock instant transfers and higher limits.
                </p>
              </div>
              <Link href="/verify">
                <Button size="sm" className="bg-warning hover:bg-warning/90 text-warning-foreground">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Verify Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* XRP Balance */}
        <Card className="animate-fade-in delay-75">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Zap className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">XRP Balance</p>
                  <p className="text-xs text-muted-foreground">Native currency</p>
                </div>
              </div>
              <button 
                onClick={refreshBalances}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {formatAmount(xrpBalance.toString())} <span className="text-lg text-muted-foreground">XRP</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* RLUSD Balance */}
        <Card className="animate-fade-in delay-150">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">RLUSD Balance</p>
                  <p className="text-xs text-muted-foreground">USD Stablecoin</p>
                </div>
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : hasTrustline ? (
              <p className="text-3xl font-bold text-foreground">
                ${formatAmount(rlusdBalance.toString())} <span className="text-lg text-muted-foreground">RLUSD</span>
              </p>
            ) : (
              <div>
                <p className="text-lg text-muted-foreground mb-2">Trustline not enabled</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleSetupTrustline}
                  disabled={isSettingTrustline || !isFunded}
                >
                  {isSettingTrustline ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enabling...
                    </>
                  ) : (
                    "Enable RLUSD"
                  )}
                </Button>
                {!isFunded && (
                  <p className="text-xs text-muted-foreground mt-1">Fund wallet first</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in delay-200">
        <QuickActions />
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - Takes 2 columns */}
        <div className="lg:col-span-2 animate-fade-in delay-300">
          <XRPPriceChart />
        </div>

        {/* Recent Activity */}
        <div className="animate-fade-in delay-300">
          <RecentActivity />
        </div>
      </div>

      {/* Bottom Section: DID Status + Getting Started */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DID Status */}
        <div className="animate-fade-in">
          <DIDStatus level={verificationLevel} showUpgradePrompt={!isVerified} />
        </div>

        {/* Getting Started Card */}
        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  1
                </span>
                <span className="text-sm text-muted-foreground">Fund your wallet with test XRP</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  2
                </span>
                <span className="text-sm text-muted-foreground">Enable RLUSD to receive stablecoin payments</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  3
                </span>
                <span className="text-sm text-muted-foreground">Verify your identity for higher limits</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  4
                </span>
                <span className="text-sm text-muted-foreground">Send RLUSD to anyone, anywhere instantly</span>
              </li>
            </ul>
            <Link href="/send">
              <Button className="w-full mt-4">
                Send Your First Transfer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
