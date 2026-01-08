"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Key, 
  Copy, 
  Check, 
  AlertTriangle,
  Eye,
  EyeOff 
} from "lucide-react";

interface SecretCodeDisplayProps {
  fulfillment: string;
  onContinue?: () => void;
}

export function SecretCodeDisplay({ fulfillment, onContinue }: SecretCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fulfillment);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const maskedCode = fulfillment.substring(0, 8) + "•".repeat(54) + fulfillment.substring(62);

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardContent className="p-6">
        {/* Warning header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Key className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 text-lg">Secret Code Generated</h3>
            <p className="text-amber-700 text-sm">
              Save this code! It&apos;s required to release the escrowed funds.
            </p>
          </div>
        </div>

        {/* Warning box */}
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Important Warning</p>
            <p className="text-sm text-red-700">
              This code is shown <strong>only once</strong> and cannot be recovered. 
              If lost, the recipient will not be able to claim the funds until the cancel period expires.
            </p>
          </div>
        </div>

        {/* Secret code display */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Secret Code (Fulfillment)</label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRevealed(!revealed)}
              className="h-7"
            >
              {revealed ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Reveal
                </>
              )}
            </Button>
          </div>
          
          <div className="relative">
            <div className="p-4 bg-white border-2 border-amber-300 rounded-xl font-mono text-sm break-all">
              {revealed ? fulfillment : maskedCode}
            </div>
            <Button
              size="sm"
              className="absolute top-2 right-2 bg-amber-600 hover:bg-amber-700"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Share this code with the recipient so they can claim the escrow.
          </p>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl mb-4 cursor-pointer hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          <span className="text-sm text-slate-700">
            I have saved the secret code and understand it cannot be recovered
          </span>
        </label>

        {/* Continue button */}
        {onContinue && (
          <Button
            className="w-full"
            size="lg"
            disabled={!confirmed}
            onClick={onContinue}
          >
            Continue
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
