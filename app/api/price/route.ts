import { NextResponse } from "next/server";

// Cache the price data for 60 seconds to reduce API calls
// Use a Map to cache per currency+days combination
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get("currency") || "usd";
  const days = searchParams.get("days") || "7";

  const cacheKey = `${currency}-${days}`;

  // Check cache for this specific currency+days combo
  const cachedEntry = cache.get(cacheKey);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION) {
    return NextResponse.json(cachedEntry.data);
  }

  try {
    // Fetch price data
    const priceResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd,sgd&include_24hr_change=true`,
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    // Fetch chart data
    const chartResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/ripple/market_chart?vs_currency=${currency}&days=${days}`,
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 60 },
      }
    );

    if (!priceResponse.ok || !chartResponse.ok) {
      // Return cached data if available, even if stale
      const staleCache = cache.get(cacheKey);
      if (staleCache) {
        return NextResponse.json(staleCache.data);
      }
      throw new Error("Failed to fetch price data");
    }

    const priceData = await priceResponse.json();
    const chartData = await chartResponse.json();

    const result = {
      price: priceData.ripple,
      chart: chartData.prices,
    };

    // Update cache for this specific currency+days combo
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Price API error:", error);

    // Return cached data if available
    const staleCache = cache.get(cacheKey);
    if (staleCache) {
      return NextResponse.json(staleCache.data);
    }

    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}

