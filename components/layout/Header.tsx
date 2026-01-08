"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { VerificationBadge } from "@/components/did/VerificationBadge";
import { formatAddress, copyToClipboard } from "@/lib/utils/format";
import { Menu, ChevronDown, Copy, Check, LogOut, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { getExplorerAccountLink } from "@/lib/xrpl/constants";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
  className?: string;
}

export function Header({ 
  title = "Dashboard", 
  onMenuClick, 
  showMobileMenu = true,
  className 
}: HeaderProps) {
  const { address, verificationLevel, logout } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (address) {
      await copyToClipboard(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Address copied!",
        description: "Your wallet address has been copied to clipboard",
        variant: "success",
      });
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-header bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border",
        className
      )}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Mobile menu + Title */}
        <div className="flex items-center gap-4">
          {showMobileMenu && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-muted transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>

        {/* Right: User Profile */}
        <div className="flex items-center gap-3">
          <VerificationBadge level={verificationLevel} size="sm" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">
                    {address ? address.slice(1, 3).toUpperCase() : "?"}
                  </span>
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-sm font-medium text-foreground truncate max-w-[100px]">
                    {address ? formatAddress(address, 4) : "Not connected"}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground hidden xl:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Wallet Address</p>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {address || "Not connected"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Address
                  </>
                )}
              </DropdownMenuItem>
              {address && (
                <DropdownMenuItem asChild>
                  <a
                    href={getExplorerAccountLink(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
