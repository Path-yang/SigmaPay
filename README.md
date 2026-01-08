# SigmaPay Σ

A cross-border financial platform for instant remittances, conditional escrow payments, and real-world asset tokenization built on the XRP Ledger.

**Live Demo:** [sigma-pay-ten.vercel.app](https://sigma-pay-ten.vercel.app)

**GitHub:** [github.com/Path-yang/SigmaPay](https://github.com/Path-yang/SigmaPay)

## The Problem

Cross-border remittances cost too much and take too long. Migrant workers sending $500 home lose $30-50 to fees and wait 3-5 days for settlement. The correspondent banking system extracts value at every step while underbanked populations have no alternatives.

Real-world assets face similar friction. Property, commodities, and trade finance instruments remain trapped within national boundaries due to regulatory complexity and lack of infrastructure.

## Our Solution

SigmaPay unifies payments, escrow, and asset tokenization into a single mobile-first interface. We leverage XRPL's native features to deliver:

- Instant transfers settling in 3-5 seconds
- Fees under $0.01 per transaction
- RLUSD stablecoin for price stability
- On-chain identity verification for compliance
- Time-locked and condition-locked escrow payments
- Real-world asset tokenization and global transfer

## Features

### Payments
Send XRP or RLUSD to anyone with an XRPL address. Verified users get direct instant payments. Unverified users send via claimable checks that recipients can review before accepting.

### Identity Verification
Three-tier verification system using XRPL's DID infrastructure:
- Unverified: $100 limit, claimable checks only
- Basic Verified: $1,000 limit, direct payments enabled
- Fully Verified: Unlimited transfers

Verification status is stored on-chain and visible to recipients, creating a transparent trust layer.

### Escrow
Create time-locked or condition-locked payments using native XRPL escrow:
- Schedule payments for future release dates
- Require secret codes for conditional release (SHA-256 crypto conditions)
- Cancel unreleased escrows after expiration
- Use cases include milestone payments, deposits, and trade settlement

### RWA Marketplace
Tokenize and transfer real-world assets globally:
- Real estate fractional ownership
- Commodities (gold, silver, oil)
- Art and collectibles
- Trade finance instruments
- Credentials and certificates

Verified users can issue tokens with rich metadata. Recipients automatically establish trustlines to receive assets.

### Live Price Chart
Real-time XRP price tracking with USD/SGD toggle and multiple time ranges (1D, 7D, 1M, 3M, 1Y).

## XRPL Features Used

| Feature | Implementation |
|---------|----------------|
| Payments | Direct RLUSD/XRP transfers for verified users |
| Checks | Claimable payment instruments for unverified users |
| Escrows | Time-locked and condition-locked payments with crypto conditions |
| DIDs | On-chain identity verification via DIDSet transactions |
| Trustlines | RLUSD integration and RWA token issuance |
| Memos | Personal messages and asset metadata storage |

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- xrpl.js v3.1
- crypto-js (AES-256 encryption)
- five-bells-condition (escrow crypto conditions)
- Vercel deployment

## Getting Started

### Prerequisites
- Node.js 18.17 or higher
- npm or yarn

### Installation

```bash
git clone https://github.com/Path-yang/SigmaPay.git
cd SigmaPay
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage

### 1. Create or Import Wallet
Choose between creating a new wallet or importing an existing seed phrase. Crossmark browser extension is also supported. Your seed is encrypted with AES-256 and stored locally.

### 2. Fund Your Wallet
Click Fund Wallet to receive test XRP from the testnet faucet. You'll receive 100-1000 XRP for transaction fees.

### 3. Enable RLUSD
Create a trustline to the RLUSD issuer to send and receive stablecoin payments.

### 4. Verify Your Identity
Complete verification to unlock higher limits and direct payments. Verification is recorded on-chain using XRPL's DID system.

### 5. Send Payments
Choose XRP or RLUSD, enter recipient address and amount, add an optional message, and send. Transactions settle in 3-5 seconds.

### 6. Create Escrow
Lock XRP with time or condition requirements. Time-based escrows release after a specified date. Condition-based escrows require a secret code to release.

### 7. Tokenize Assets
Verified users can create RWA tokens representing real-world assets. Fill in asset details and metadata, then send tokens to anyone globally.

## Project Structure

```
SigmaPay/
├── app/
│   ├── api/              # Server-side API routes
│   │   ├── faucet/       # Testnet faucet proxy
│   │   └── price/        # CoinGecko price proxy
│   ├── dashboard/        # Main dashboard
│   ├── send/             # Payment flow
│   ├── receive/          # Receive and claim checks
│   ├── escrow/           # Escrow management
│   ├── rwa/              # RWA marketplace
│   ├── tokenize/         # Asset tokenization
│   ├── verify/           # Identity verification
│   └── history/          # Transaction history
├── components/
│   ├── wallet/           # Wallet management
│   ├── did/              # Verification badges
│   ├── escrow/           # Escrow UI
│   ├── rwa/              # RWA components
│   └── ui/               # shadcn components
├── lib/
│   └── xrpl/             # XRPL integration
│       ├── client.ts     # Connection management
│       ├── payments.ts   # Payment transactions
│       ├── checks.ts     # Check transactions
│       ├── escrow.ts     # Escrow transactions
│       ├── did.ts        # DID operations
│       ├── rwa.ts        # RWA tokenization
│       └── trustline.ts  # Trustline management
└── types/                # TypeScript definitions
```

## Configuration

```typescript
// Network
XRPL_TESTNET_URL = "wss://testnet.xrpl-labs.com"

// RLUSD Issuer (from tryrlusd.com)
RLUSD_ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV"
RLUSD_CURRENCY = "524C555344000000000000000000000000000000"

// Explorer
EXPLORER_BASE_URL = "https://testnet.xrpl.org"
```

## Security

| Aspect | Implementation |
|--------|----------------|
| Key Storage | AES-256 encrypted in browser localStorage |
| Password | Never stored, used only for encryption/decryption |
| Transaction Signing | All signing happens client-side |
| Private Keys | Never transmitted to any server |
| RWA Issuance | Requires identity verification |

This is a hackathon MVP. Production deployment would add hardware wallet support, multi-signature accounts, and secure enclave storage.

## Verification

All transactions are verifiable on the public XRPL testnet explorer at https://testnet.xrpl.org

## Resources

- [XRPL Documentation](https://xrpl.org/docs)
- [RLUSD Testnet Faucet](https://tryrlusd.com)
- [Ripple DevRel Resources](https://linktr.ee/rippledevrel)
- [XRPL Testnet Explorer](https://testnet.xrpl.org)

## Team

Built for the NUS FinTech Summit 2026 Hackathon

## License

MIT License
