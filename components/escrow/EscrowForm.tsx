"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/components/wallet/WalletProvider";
import { 
  createEscrow, 
  storeEscrow, 
  EscrowReleaseType,
  CreateEscrowResult 
} from "@/lib/xrpl/escrow";
import { getWalletFromSeed } from "@/lib/xrpl/wallet";
import { isValidXRPLAddress, formatAmount } from "@/lib/utils/format";
import { getExplorerTxLink } from "@/lib/xrpl/constants";
import { SecretCodeDisplay } from "./SecretCodeDisplay";
import { toast } from "@/components/ui/use-toast";
import {
  Lock,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Coins,
  User,
  MessageSquare,
  ExternalLink,
  Clock,
  Key,
  Calendar,
  AlertTriangle,
  Info
} from "lucide-react";
import Link from "next/link";

type Step = "type" | "details" | "confirm" | "secret" | "success";

export function EscrowForm() {
  const { wallet, balances, refreshBalances } = useWallet();

  const [step, setStep] = useState<Step>("type");
  const [releaseType, setReleaseType] = useState<EscrowReleaseType>("time");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [releaseTime, setReleaseTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CreateEscrowResult | null>(null);

  // Balance calculations
  const xrpBalance = parseFloat(balances.xrp) || 0;
  // Reserve 12 XRP (10 base + 2 for escrow object)
  const availableXRP = Math.max(0, xrpBalance - 12);
  const amountNum = parseFloat(amount) || 0;
  const hasEnoughBalance = amountNum > 0 && amountNum <= availableXRP;

  // Get release datetime
  const getReleaseDatetime = (): Date | null => {
    if (!releaseDate) return null;
    const datetime = releaseTime 
      ? new Date(`${releaseDate}T${releaseTime}`)
      : new Date(`${releaseDate}T00:00:00`);
    return datetime;
  };

  // Validate release date (must be in future)
  const releaseDatetime = getReleaseDatetime();
  const isReleaseDateValid = releaseType === "condition" || 
    (releaseDatetime && releaseDatetime > new Date());

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  const handleNext = () => {
    switch (step) {
      case "type":
        setStep("details");
        break;
      case "details":
        // Validate
        if (!hasEnoughBalance) {
          toast({
            title: "Invalid amount",
            description: amountNum > availableXRP
              ? "Insufficient XRP balance (need 12 XRP reserve)"
              : "Please enter a valid amount",
            variant: "destructive",
          });
          return;
        }
        if (!isValidXRPLAddress(recipient)) {
          toast({
            title: "Invalid address",
            description: "Please enter a valid XRPL address",
            variant: "destructive",
          });
          return;
        }
        if ((releaseType === "time" || releaseType === "both") && !isReleaseDateValid) {
          toast({
            title: "Invalid release date",
            description: "Release date must be in the future",
            variant: "destructive",
          });
          return;
        }
        setStep("confirm");
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case "details":
        setStep("type");
        break;
      case "confirm":
        setStep("details");
        break;
    }
  };

  const handleCreate = async () => {
    if (!wallet) return;

    setIsLoading(true);

    try {
      const xrplWallet = getWalletFromSeed(wallet.seed!);

      const escrowResult = await createEscrow(xrplWallet, {
        destination: recipient,
        amount,
        releaseType,
        finishAfter: releaseDatetime || undefined,
        memo: message || undefined,
      });

      if (escrowResult.success) {
        setResult(escrowResult);

        // Store escrow locally
        storeEscrow({
          owner: wallet.classicAddress,
          destination: recipient,
          sequence: escrowResult.sequence!,
          amount,
          releaseType,
          finishAfter: releaseDatetime ? Math.floor(releaseDatetime.getTime() / 1000) : undefined,
          condition: escrowResult.condition,
          fulfillment: escrowResult.fulfillment,
          memo: message,
          createdAt: Date.now(),
          hash: escrowResult.hash,
        });

        // If condition-based, show secret first
        const isConditionBased = releaseType === "condition" || releaseType === "both";
        
        if (isConditionBased && escrowResult.fulfillment) {
          setStep("secret");
        } else {
          setStep("success");
        }

        await refreshBalances();

        toast({
          title: "Escrow created!",
          description: `${formatAmount(amount)} XRP has been escrowed`,
          variant: "success",
        });
      } else {
        throw new Error(escrowResult.error || "Failed to create escrow");
      }
    } catch (err) {
      toast({
        title: "Failed to create escrow",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep("type");
    setReleaseType("time");
    setAmount("");
    setRecipient("");
    setMessage("");
    setReleaseDate("");
    setReleaseTime("");
    setResult(null);
  };

  // Secret code step
  if (step === "secret") {
    if (!result?.fulfillment) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-500">Generating secret code...</p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <SecretCodeDisplay
        fulfillment={result.fulfillment}
        onContinue={() => setStep("success")}
      />
    );
  }

  // Success step
  if (step === "success" && result) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Escrow Created!
          </h2>
          <p className="text-slate-500 mb-4">
            {formatAmount(amount)} XRP has been locked in escrow
          </p>

          <div className="p-4 bg-slate-50 rounded-xl mb-6 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Recipient</span>
              <span className="font-mono">{recipient.slice(0, 8)}...{recipient.slice(-6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Release Type</span>
              <span className="capitalize">{releaseType === "both" ? "Time + Code" : releaseType}</span>
            </div>
            {releaseDatetime && (
              <div className="flex justify-between">
                <span className="text-slate-500">Unlocks</span>
                <span>{releaseDatetime.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {result.hash && (
              <a
                href={getExplorerTxLink(result.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
              </a>
            )}
            <Button className="flex-1" onClick={handleReset}>
              <Lock className="w-4 h-4 mr-2" />
              Create Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Create Escrow
        </CardTitle>
        <CardDescription>
          Lock XRP with time or condition-based release
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {["type", "details", "confirm"].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? "bg-indigo-600 text-white"
                    : ["type", "details", "confirm"].indexOf(step) > i
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {["type", "details", "confirm"].indexOf(step) > i ? "✓" : i + 1}
              </div>
              {i < 2 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    ["type", "details", "confirm"].indexOf(step) > i
                      ? "bg-emerald-500"
                      : "bg-slate-100"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Type Selection Step */}
        {step === "type" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 mb-4">
              How should the escrow be released?
            </p>

            <div className="space-y-3">
              {/* Time-based option */}
              <button
                onClick={() => setReleaseType("time")}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  releaseType === "time"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    releaseType === "time" ? "bg-indigo-100" : "bg-slate-100"
                  }`}>
                    <Clock className={`w-5 h-5 ${
                      releaseType === "time" ? "text-indigo-600" : "text-slate-500"
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Time-Based</p>
                    <p className="text-sm text-slate-500">
                      Funds unlock after a specific date and time
                    </p>
                  </div>
                </div>
              </button>

              {/* Condition-based option */}
              <button
                onClick={() => setReleaseType("condition")}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  releaseType === "condition"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    releaseType === "condition" ? "bg-indigo-100" : "bg-slate-100"
                  }`}>
                    <Key className={`w-5 h-5 ${
                      releaseType === "condition" ? "text-indigo-600" : "text-slate-500"
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Condition-Based</p>
                    <p className="text-sm text-slate-500">
                      Funds unlock when recipient provides a secret code
                    </p>
                  </div>
                </div>
              </button>

              {/* Both option */}
              <button
                onClick={() => setReleaseType("both")}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  releaseType === "both"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    releaseType === "both" ? "bg-indigo-100" : "bg-slate-100"
                  }`}>
                    <Lock className={`w-5 h-5 ${
                      releaseType === "both" ? "text-indigo-600" : "text-slate-500"
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Time + Condition</p>
                    <p className="text-sm text-slate-500">
                      Both time AND secret code required to release
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <Button className="w-full" size="lg" onClick={handleNext}>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Details Step */}
        {step === "details" && (
          <div className="space-y-4">
            {/* Balance info */}
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Available XRP Balance</p>
              <p className="text-xl font-bold text-slate-900">
                {formatAmount(availableXRP.toString())} XRP
              </p>
              <p className="text-xs text-slate-400 mt-1">
                (12 XRP reserved for account + escrow object)
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (XRP)</Label>
              <div className="relative">
                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-11 text-xl h-14"
                  step="0.000001"
                  min="0"
                />
              </div>
            </div>

            {/* Recipient */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="recipient"
                  placeholder="rXXXX..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="pl-11"
                />
              </div>
            </div>

            {/* Release Date (if time-based) */}
            {(releaseType === "time" || releaseType === "both") && (
              <div className="space-y-2">
                <Label>Release Date & Time</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="date"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      min={today}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="time"
                      value={releaseTime}
                      onChange={(e) => setReleaseTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <Textarea
                  id="message"
                  placeholder="Add a note..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="pl-11 min-h-[80px]"
                  maxLength={200}
                />
              </div>
            </div>

            {/* Info about condition-based */}
            {(releaseType === "condition" || releaseType === "both") && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  A secret code will be generated after creation. Share it with the recipient to release funds.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Confirm Step */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-semibold">{formatAmount(amount)} XRP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient</span>
                <span className="font-mono text-sm">
                  {recipient.slice(0, 8)}...{recipient.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Release Type</span>
                <span className="capitalize">
                  {releaseType === "time" && "Time-Based"}
                  {releaseType === "condition" && "Condition-Based"}
                  {releaseType === "both" && "Time + Condition"}
                </span>
              </div>
              {releaseDatetime && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Unlocks After</span>
                  <span>{releaseDatetime.toLocaleString()}</span>
                </div>
              )}
              {message && (
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-slate-500 text-sm mb-1">Message:</p>
                  <p className="text-slate-700">&quot;{message}&quot;</p>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">Important:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Escrowed XRP is locked until release conditions are met</li>
                  <li>An additional 2 XRP will be reserved for the escrow object</li>
                  {(releaseType === "condition" || releaseType === "both") && (
                    <li>You must save and share the secret code with the recipient</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
              <p className="text-sm text-indigo-700">
                <strong>Network Fee:</strong> ~0.00001 XRP
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleCreate}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Create Escrow
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
