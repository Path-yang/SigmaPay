"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Inbox, Lock, Clock, ArrowRight, Briefcase, Shield } from "lucide-react";

const actions = [
  {
    href: "/send",
    label: "Send Money",
    description: "Transfer RLUSD instantly",
    icon: Send,
    color: "bg-primary",
  },
  {
    href: "/receive",
    label: "Receive",
    description: "Get your wallet address",
    icon: Inbox,
    color: "bg-chart-2",
  },
  {
    href: "/escrow",
    label: "Escrow",
    description: "Secure conditional payments",
    icon: Lock,
    color: "bg-chart-4",
  },
  {
    href: "/rwa",
    label: "RWA Market",
    description: "Trade tokenized assets",
    icon: Briefcase,
    color: "bg-chart-5",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <div className="group p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/50 transition-all cursor-pointer">
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                  {action.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
