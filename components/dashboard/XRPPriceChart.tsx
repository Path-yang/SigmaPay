"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface PriceData {
  current: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  prices: [number, number][]; // [timestamp, price]
}

type TimeRange = "1D" | "7D" | "1M" | "3M" | "1Y";

const TIME_RANGES: { label: TimeRange; days: number }[] = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
];

export function XRPPriceChart() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("7D");

  const fetchPrice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const days = TIME_RANGES.find((t) => t.label === timeRange)?.days || 7;

      // Fetch current price
      const priceResponse = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true&include_24hr_high=true&include_24hr_low=true"
      );

      // Fetch chart data
      const chartResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/ripple/market_chart?vs_currency=usd&days=${days}`
      );

      if (!priceResponse.ok || !chartResponse.ok) {
        throw new Error("Failed to fetch price");
      }

      const priceJson = await priceResponse.json();
      const chartJson = await chartResponse.json();

      // Calculate change based on chart data
      const prices = chartJson.prices as [number, number][];
      const firstPrice = prices[0]?.[1] || 0;
      const lastPrice = prices[prices.length - 1]?.[1] || 0;
      const change = lastPrice - firstPrice;
      const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

      setPriceData({
        current: priceJson.ripple?.usd || lastPrice,
        change24h: change,
        changePercent24h: changePercent,
        high24h: Math.max(...prices.map((p) => p[1])),
        low24h: Math.min(...prices.map((p) => p[1])),
        prices: prices,
      });
    } catch (err) {
      setError("Unable to load price");
      console.error("Price fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const isPositive = priceData && priceData.changePercent24h >= 0;
  const chartColor = isPositive ? "#10b981" : "#ef4444";

  // Render the main chart
  const renderChart = () => {
    if (!priceData?.prices?.length) return null;

    const prices = priceData.prices;
    const values = prices.map((p) => p[1]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const width = 100; // percentage
    const height = 150;
    const padding = 5;

    // Generate path
    const points = prices.map((point, index) => {
      const x = (index / (prices.length - 1)) * 100;
      const y = height - padding - ((point[1] - min) / range) * (height - padding * 2);
      return { x, y, price: point[1], time: point[0] };
    });

    const pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    // Create gradient fill path
    const fillD = `${pathD} L 100 ${height} L 0 ${height} Z`;

    return (
      <div className="relative w-full" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Fill area */}
          <path d={fillD} fill="url(#chartGradient)" />
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={chartColor}
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: "2px" }}
          />
        </svg>
      </div>
    );
  };

  if (loading && !priceData) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="space-y-2">
                <div className="w-20 h-4 bg-slate-200 rounded" />
                <div className="w-32 h-8 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="w-full h-[150px] bg-slate-200 rounded" />
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
        {/* Header with price */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm text-slate-500 mb-1">XRP / USD</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">
                ${priceData?.current?.toFixed(4) || "0.00"}
              </span>
              <span
                className={`flex items-center text-sm font-semibold ${
                  isPositive ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {isPositive ? "+" : ""}
                {priceData?.changePercent24h?.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isPositive ? "+" : ""}${priceData?.change24h?.toFixed(4)} {timeRange}
            </p>
          </div>
          {loading && (
            <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
          )}
        </div>

        {/* Time range selector */}
        <div className="flex gap-1 mb-4">
          {TIME_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setTimeRange(range.label)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                timeRange === range.label
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="relative">
          {renderChart()}
          
          {/* Y-axis labels */}
          <div className="absolute top-0 right-0 h-full flex flex-col justify-between text-[10px] text-slate-400 py-1">
            <span>${priceData?.high24h?.toFixed(3)}</span>
            <span>${priceData?.low24h?.toFixed(3)}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-sm">
          <div>
            <p className="text-xs text-slate-400">High</p>
            <p className="font-medium text-emerald-600">
              ${priceData?.high24h?.toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Low</p>
            <p className="font-medium text-red-500">
              ${priceData?.low24h?.toFixed(4)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Volume</p>
            <p className="font-medium text-slate-700">Live</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
