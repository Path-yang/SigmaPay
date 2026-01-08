"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceData {
  current: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  sparkline: number[];
}

type TimeRange = "1D" | "7D" | "1M" | "3M" | "1Y";
type Currency = "usd" | "sgd";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  usd: "$",
  sgd: "S$",
};

export function XRPPriceChart() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("7D");
  const [currency, setCurrency] = useState<Currency>("usd");

  const fetchPrice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine days based on time range
      const daysMap: Record<TimeRange, number> = {
        "1D": 1,
        "7D": 7,
        "1M": 30,
        "3M": 90,
        "1Y": 365,
      };
      const days = daysMap[timeRange];
      
      // Fetch current price data with selected currency
      const priceResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=${currency}&include_24hr_change=true`
      );
      
      // Fetch historical data for chart with selected currency
      const chartResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/ripple/market_chart?vs_currency=${currency}&days=${days}`
      );
      
      if (!priceResponse.ok || !chartResponse.ok) {
        throw new Error("Failed to fetch price");
      }
      
      const priceDataResult = await priceResponse.json();
      const chartData = await chartResponse.json();
      
      const prices = chartData.prices.map((p: [number, number]) => p[1]);
      const currentPrice = priceDataResult.ripple[currency];
      const firstPrice = prices[0] || currentPrice;
      const change = currentPrice - firstPrice;
      const changePercent = (change / firstPrice) * 100;
      
      setPriceData({
        current: currentPrice,
        change: change,
        changePercent: changePercent,
        high: Math.max(...prices),
        low: Math.min(...prices),
        sparkline: prices,
      });
    } catch (err) {
      setError("Unable to load price");
      console.error("Price fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, currency]);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const isPositive = priceData?.changePercent && priceData.changePercent >= 0;
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  // Render the chart
  const renderChart = () => {
    if (!priceData?.sparkline?.length) return null;
    
    const data = priceData.sparkline;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = range * 0.05;
    
    const height = 200;
    const dataPoints = data.length > 100 ? data.filter((_, i) => i % Math.ceil(data.length / 100) === 0) : data;
    
    const points = dataPoints.map((value, index) => {
      const x = (index / (dataPoints.length - 1)) * 100;
      const y = height - ((value - min + padding) / (range + padding * 2)) * height;
      return `${x},${y}`;
    }).join(" ");

    const areaPoints = `0,${height} ${points} 100,${height}`;

    return (
      <div className="relative">
        <svg 
          viewBox={`0 0 100 ${height}`} 
          className="w-full h-52"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.25" />
              <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <polygon
            fill="url(#areaGradient)"
            points={areaPoints}
          />
          {/* Line */}
          <polyline
            fill="none"
            stroke={isPositive ? "#10b981" : "#ef4444"}
            strokeWidth="0.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
        {/* Price labels on right side */}
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-2 text-xs text-muted-foreground">
          <span>{currencySymbol}{max.toFixed(3)}</span>
          <span>{currencySymbol}{min.toFixed(3)}</span>
        </div>
      </div>
    );
  };

  const timeRanges: TimeRange[] = ["1D", "7D", "1M", "3M", "1Y"];
  const timeRangeLabels: Record<TimeRange, string> = {
    "1D": "1D",
    "7D": "7D", 
    "1M": "1M",
    "3M": "3M",
    "1Y": "1Y",
  };

  if (loading && !priceData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="w-24 h-4 bg-muted rounded animate-pulse" />
            <div className="w-40 h-10 bg-muted rounded animate-pulse" />
            <div className="flex gap-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-12 h-8 bg-muted rounded animate-pulse" />
              ))}
            </div>
            <div className="w-full h-52 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !priceData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={fetchPrice} className="text-sm text-primary mt-2 hover:underline">
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-muted-foreground">XRP / {currency.toUpperCase()}</p>
            {/* Currency Toggle */}
            <div className="flex bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setCurrency("usd")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  currency === "usd"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                USD
              </button>
              <button
                onClick={() => setCurrency("sgd")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  currency === "sgd"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                SGD
              </button>
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-foreground">
              {currencySymbol}{priceData?.current?.toFixed(4) || "0.0000"}
            </span>
            <span className={`flex items-center text-lg font-medium ${isPositive ? "text-success" : "text-destructive"}`}>
              {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {isPositive ? "+" : ""}{priceData?.changePercent?.toFixed(2)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isPositive ? "+" : ""}{currencySymbol}{priceData?.change?.toFixed(4)} {timeRange}
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-4">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timeRange === range
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {timeRangeLabels[range]}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="pr-12">
          {renderChart()}
        </div>
        
        {/* Bottom Stats */}
        <div className="flex items-center gap-8 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground">High</p>
            <p className="text-lg font-semibold text-success">{currencySymbol}{priceData?.high?.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Low</p>
            <p className="text-lg font-semibold text-destructive">{currencySymbol}{priceData?.low?.toFixed(4)}</p>
          </div>
          <div className="ml-auto">
            <p className="text-sm text-muted-foreground">Volume</p>
            <p className="text-lg font-semibold text-foreground">Live</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
