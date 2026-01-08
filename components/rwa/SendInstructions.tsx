"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Users, 
  Wallet, 
  Send,
  Globe
} from "lucide-react";

interface SendInstructionsProps {
  className?: string;
}

export function SendInstructions({ className }: SendInstructionsProps) {
  const steps = [
    {
      icon: Users,
      title: "Recipient Creates Trustline",
      description: "The recipient must first create a trustline for your token in their wallet",
      status: "required" as const,
    },
    {
      icon: Wallet,
      title: "Enter Recipient Address",
      description: "Enter the recipient's XRPL address (starts with 'r')",
      status: "active" as const,
    },
    {
      icon: Send,
      title: "Send Tokens",
      description: "Specify the amount and send the tokens instantly",
      status: "pending" as const,
    },
    {
      icon: Globe,
      title: "Global Transfer Complete",
      description: "Tokens are transferred on the XRP Ledger within seconds",
      status: "pending" as const,
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">How to Send RWA Tokens</CardTitle>
        <CardDescription>
          Follow these steps to transfer your real-world asset tokens to anyone globally
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {step.status === "required" ? (
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                    <Circle className="w-4 h-4 text-amber-600" />
                  </div>
                ) : step.status === "active" ? (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                    <Circle className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-slate-600" />
                  <h4 className="font-semibold text-sm">{step.title}</h4>
                  {step.status === "required" && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Required
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-300 mt-2" />
              )}
            </div>
          );
        })}
        
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p className="font-semibold mb-1">💡 Pro Tip</p>
          <p>Share your token information with the recipient first so they can create the required trustline. Use the "Share Token Info" button to copy the details.</p>
        </div>
      </CardContent>
    </Card>
  );
}