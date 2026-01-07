"use client";

import { VerificationLevel } from "@/lib/xrpl/constants";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { cn } from "@/lib/utils/format";

interface VerificationBadgeProps {
  level: VerificationLevel;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const config = {
  [VerificationLevel.UNVERIFIED]: {
    icon: ShieldAlert,
    label: "Unverified",
    bgColor: "bg-slate-100",
    textColor: "text-slate-600",
    borderColor: "border-slate-300",
    iconColor: "text-slate-500",
  },
  [VerificationLevel.BASIC]: {
    icon: Shield,
    label: "Basic Verified",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    iconColor: "text-blue-500",
  },
  [VerificationLevel.VERIFIED]: {
    icon: ShieldCheck,
    label: "Fully Verified",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    iconColor: "text-emerald-500",
  },
};

const sizes = {
  sm: {
    badge: "px-2 py-0.5 text-xs",
    icon: "w-3 h-3",
  },
  md: {
    badge: "px-2.5 py-1 text-sm",
    icon: "w-4 h-4",
  },
  lg: {
    badge: "px-3 py-1.5 text-base",
    icon: "w-5 h-5",
  },
};

export function VerificationBadge({ 
  level, 
  showLabel = true, 
  size = "md",
  className 
}: VerificationBadgeProps) {
  const { icon: Icon, label, bgColor, textColor, borderColor, iconColor } = config[level];
  const sizeConfig = sizes[size];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        bgColor,
        textColor,
        borderColor,
        sizeConfig.badge,
        className
      )}
    >
      <Icon className={cn(sizeConfig.icon, iconColor)} />
      {showLabel && <span>{label}</span>}
    </div>
  );
}

export function VerificationIcon({ level, className }: { level: VerificationLevel; className?: string }) {
  const { icon: Icon, iconColor } = config[level];
  return <Icon className={cn("w-4 h-4", iconColor, className)} />;
}

