import { NextResponse } from "next/server";

// Multiple faucet endpoints for fallback
const FAUCET_URLS = [
  "https://faucet.altnet.rippletest.net/accounts",
  "https://faucet.devnet.rippletest.net/accounts",
];

async function tryFaucet(url: string, address: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destination: address,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Faucet returned ${response.status}: ${text}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      balance: data.balance || 10000,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Faucet request failed",
    };
  }
}

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address || !address.startsWith("r")) {
      return NextResponse.json(
        { success: false, error: "Invalid address" },
        { status: 400 }
      );
    }

    // Try each faucet with retries
    for (const faucetUrl of FAUCET_URLS) {
      // Try up to 3 times per faucet
      for (let attempt = 0; attempt < 3; attempt++) {
        console.log(`Trying faucet ${faucetUrl}, attempt ${attempt + 1}`);
        
        const result = await tryFaucet(faucetUrl, address);
        
        if (result.success) {
          return NextResponse.json({
            success: true,
            balance: result.balance,
            faucet: faucetUrl,
          });
        }

        // Wait before retry (exponential backoff)
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // All faucets failed
    return NextResponse.json(
      { 
        success: false, 
        error: "All faucets are currently busy. Please try again in a few seconds." 
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Faucet API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fund wallet" 
      },
      { status: 500 }
    );
  }
}

