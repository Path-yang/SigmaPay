"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface PriceData {
  current: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  sparkline: number[];
}

export function XRPPriceChart() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // CoinGecko free API - no auth needed
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/ripple?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true"
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch price");
      }
      
      const data = await response.json();
      
      setPriceData({
        current: data.market_data.current_price.usd,
        change24h: data.market_data.price_change_24h,
        changePercent24h: data.market_data.price_change_percentage_24h,
        high24h: data.market_data.high_24h.usd,
        low24h: data.market_data.low_24h.usd,
        sparkline: data.market_data.sparkline_7d?.price?.slice(-24) || [], // Last 24 data points
      });
    } catch (err) {
      setError("Unable to load price");
      console.error("Price fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    // Refresh every 60 seconds
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const isPositive = priceData?.changePercent24h && priceData.changePercent24h >= 0;

  // Mini sparkline chart
  const renderSparkline = () => {
    if (!priceData?.sparkline?.length) return null;
    
    const data = priceData.sparkline;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const width = 120;
    const height = 40;
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(" ");

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={isPositive ? "#10b981" : "#ef4444"}
          strokeWidth="2"
          points={points}
        />
        <polygon
          fill="url(#sparklineGradient)"
          points={`0,${height} ${points} ${width},${height}`}
        />
      </svg>
    );
  };

  if (loading && !priceData) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
              <div className="space-y-2">
                <div className="w-16 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-24 h-6 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-[120px] h-[40px] bg-slate-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !priceData) {
    return (
      <Card className="mb-6 border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={fetchPrice} className="text-red-600 hover:text-red-700">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Price info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">X</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 font-medium">XRP/USD</span>
                {loading && <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-900">
                  ${priceData?.current?.toFixed(4) || "0.00"}
                </span>
                <span className={`flex items-center text-sm font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {isPositive ? "+" : ""}{priceData?.changePercent24h?.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Right side - Sparkline */}
          <div className="hidden sm:block">
            {renderSparkline()}
          </div>
        </div>
        
        {/* 24h High/Low */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
          <div className="flex-1">
            <p className="text-xs text-slate-500">24h High</p>
            <p className="text-sm font-medium text-emerald-600">${priceData?.high24h?.toFixed(4)}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500">24h Low</p>
            <p className="text-sm font-medium text-red-600">${priceData?.low24h?.toFixed(4)}</p>
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs text-slate-500">24h Change</p>
            <p className={`text-sm font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
              {isPositive ? "+" : ""}${priceData?.change24h?.toFixed(4)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

