"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/wallet/WalletProvider";
import { copyToClipboard } from "@/lib/utils/format";
import { toast } from "@/components/ui/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Download, Share2 } from "lucide-react";

export function ReceiveAddress() {
    const { address } = useWallet();
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (address) {
            await copyToClipboard(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast({
                title: "Address copied!",
                description: "Share this address to receive payments",
                variant: "success",
            });
        }
    };

    const handleShare = async () => {
        if (address && navigator.share) {
            try {
                await navigator.share({
                    title: "My SigmaPay Wallet",
                    text: `Send me RLUSD: ${address}`,
                });
            } catch (err) {
                // User cancelled or share failed
                handleCopy();
            }
        } else {
            handleCopy();
        }
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Receive Payment</CardTitle>
                <CardDescription>
                    Share your address or QR code to receive RLUSD
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* QR Code */}
                <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-2xl shadow-lg border-2 border-slate-100">
                        {address && (
                            <QRCodeSVG
                                value={address}
                                size={180}
                                level="M"
                                includeMargin={false}
                                bgColor="#ffffff"
                                fgColor="#1e293b"
                            />
                        )}
                    </div>
                </div>

                {/* Address */}
                <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2 text-center">Your Wallet Address</p>
                    <p className="text-sm font-mono text-slate-700 break-all text-center">
                        {address}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleCopy}
                    >
                        {copied ? (
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
                    <Button
                        className="flex-1"
                        onClick={handleShare}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
