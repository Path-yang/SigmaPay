"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "./WalletProvider";
import { toast } from "@/components/ui/use-toast";
import { Wallet, Key, Loader2, Copy, Eye, EyeOff, Check } from "lucide-react";

export function WalletSetup() {
    const { createWallet, importWalletFromSeed, isLoading } = useWallet();

    const [createPassword, setCreatePassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [importSeed, setImportSeed] = useState("");
    const [importPassword, setImportPassword] = useState("");
    const [showSeed, setShowSeed] = useState(false);
    const [generatedSeed, setGeneratedSeed] = useState<string | null>(null);
    const [seedCopied, setSeedCopied] = useState(false);

    const handleCreateWallet = async () => {
        if (createPassword.length < 6) {
            toast({
                title: "Password too short",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }

        if (createPassword !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "Please make sure both passwords are the same",
                variant: "destructive",
            });
            return;
        }

        try {
            const { seed } = await createWallet(createPassword);
            setGeneratedSeed(seed);
            toast({
                title: "Wallet created!",
                description: "Make sure to save your seed phrase securely",
                variant: "success",
            });
        } catch (err) {
            toast({
                title: "Failed to create wallet",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        }
    };

    const handleImportWallet = async () => {
        if (!importSeed.trim()) {
            toast({
                title: "Seed required",
                description: "Please enter your wallet seed phrase",
                variant: "destructive",
            });
            return;
        }

        if (importPassword.length < 6) {
            toast({
                title: "Password too short",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }

        try {
            await importWalletFromSeed(importSeed.trim(), importPassword);
            toast({
                title: "Wallet imported!",
                description: "Your wallet has been successfully imported",
                variant: "success",
            });
        } catch (err) {
            toast({
                title: "Failed to import wallet",
                description: err instanceof Error ? err.message : "Invalid seed phrase",
                variant: "destructive",
            });
        }
    };

    const copySeed = async () => {
        if (generatedSeed) {
            await navigator.clipboard.writeText(generatedSeed);
            setSeedCopied(true);
            setTimeout(() => setSeedCopied(false), 2000);
            toast({
                title: "Seed copied!",
                description: "Store it somewhere safe - you'll need it to recover your wallet",
                variant: "success",
            });
        }
    };

    if (generatedSeed) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle>Wallet Created!</CardTitle>
                    <CardDescription>
                        Save your seed phrase securely. You&apos;ll need it to recover your wallet.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                            <p className="text-sm font-medium text-amber-800 mb-2">Your Secret Seed:</p>
                            <code className="text-sm font-mono text-amber-900 break-all">
                                {showSeed ? generatedSeed : "•".repeat(32)}
                            </code>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSeed(!showSeed)}
                                className="flex-1"
                            >
                                {showSeed ? (
                                    <>
                                        <EyeOff className="w-4 h-4 mr-2" />
                                        Hide
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Show
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copySeed}
                                className="flex-1"
                            >
                                {seedCopied ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-700">
                            <strong>Warning:</strong> Never share your seed phrase. Anyone with access to it can steal your funds.
                        </p>
                    </div>

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={() => setGeneratedSeed(null)}
                    >
                        I&apos;ve Saved My Seed
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
                    <Wallet className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>
                    Create a new wallet or import an existing one
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="create" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create">Create New</TabsTrigger>
                        <TabsTrigger value="import">Import</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-password">Password</Label>
                            <Input
                                id="create-password"
                                type="password"
                                placeholder="Create a secure password"
                                value={createPassword}
                                onChange={(e) => setCreatePassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleCreateWallet}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Wallet className="w-4 h-4 mr-2" />
                                    Create Wallet
                                </>
                            )}
                        </Button>
                    </TabsContent>

                    <TabsContent value="import" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="import-seed">Seed Phrase</Label>
                            <Input
                                id="import-seed"
                                type="password"
                                placeholder="Enter your secret seed"
                                value={importSeed}
                                onChange={(e) => setImportSeed(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="import-password">Password</Label>
                            <Input
                                id="import-password"
                                type="password"
                                placeholder="Create a password to secure your wallet"
                                value={importPassword}
                                onChange={(e) => setImportPassword(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleImportWallet}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Key className="w-4 h-4 mr-2" />
                                    Import Wallet
                                </>
                            )}
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
