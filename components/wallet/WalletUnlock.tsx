"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "./WalletProvider";
import { toast } from "@/components/ui/use-toast";
import { Lock, Loader2 } from "lucide-react";

export function WalletUnlock() {
    const { unlockWallet, address, isLoading, logout } = useWallet();
    const [password, setPassword] = useState("");

    const handleUnlock = async () => {
        if (!password) {
            toast({
                title: "Password required",
                description: "Please enter your password",
                variant: "destructive",
            });
            return;
        }

        try {
            await unlockWallet(password);
            toast({
                title: "Wallet unlocked!",
                description: "Welcome back",
                variant: "success",
            });
        } catch (err) {
            toast({
                title: "Failed to unlock",
                description: err instanceof Error ? err.message : "Invalid password",
                variant: "destructive",
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleUnlock();
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                    Enter your password to unlock your wallet
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Wallet Address</p>
                    <p className="text-sm font-mono text-slate-700 truncate">{address}</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="unlock-password">Password</Label>
                    <Input
                        id="unlock-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <Button
                    className="w-full"
                    size="lg"
                    onClick={handleUnlock}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Unlocking...
                        </>
                    ) : (
                        <>
                            <Lock className="w-4 h-4 mr-2" />
                            Unlock Wallet
                        </>
                    )}
                </Button>

                <div className="text-center">
                    <button
                        onClick={logout}
                        className="text-sm text-slate-500 hover:text-red-500 transition-colors"
                    >
                        Use a different wallet
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
