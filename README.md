# SigmaPay Σ

> Send money & real-world assets home instantly. No hidden fees. Verified & secure.

## 🎯 Problem

Sending small amounts of money internationally (remittances) is expensive due to high flat fees and slow processing times. Migrant workers often pay 5-10% in fees just to send money to their families. Additionally, transferring tokenized real-world assets across borders is complex and inaccessible.

## 💡 Solution

SigmaPay is a mobile-first web app that leverages the XRP Ledger to enable:
- **Instant, low-cost international transfers** using RLUSD stablecoin
- **RWA Marketplace** for tokenizing and transferring real-world assets globally
- **DID-based identity verification** for higher limits and compliance

## 🔧 XRPL Features Used

| Feature | How We Use It |
|---------|---------------|
| **RLUSD** | Core payment currency - stable USD value |
| **Payments** | Direct instant transfers for verified users |
| **Checks** | Claimable payments for unverified users |
| **DID** | On-chain identity verification |
| **Credentials** | Permissioned flows based on verification level |
| **Memos** | Personal messages and RWA metadata |
| **Trustlines/IOUs** | Real-world asset tokenization |

## 🏠 RWA Marketplace (NEW!)

Tokenize and transfer real-world assets globally:

| Asset Category | Examples |
|----------------|----------|
| 🏠 **Real Estate** | Fractional property ownership |
| 🥇 **Commodities** | Tokenized gold, silver, oil |
| 🎨 **Art** | Artwork & collectibles |
| 📄 **Trade Finance** | Invoices, receivables |
| 🎓 **Credentials** | Certificates, licenses |
| 📈 **Securities** | Stocks, bonds |

### RWA Features
- **Tokenize Assets** - Create blockchain-backed tokens representing physical assets
- **Global Transfer** - Send RWA tokens to anyone worldwide in 3-5 seconds
- **Verification Required** - Only verified users can issue RWA tokens (trust & compliance)
- **Rich Metadata** - Asset details, valuations, documents stored on-chain
- **Marketplace** - Browse and receive tokenized assets from other issuers

## 🔐 Verification Levels

| Level | Send Limit | Payment Method | RWA Issuance |
|-------|------------|----------------|--------------|
| Unverified | $100 | Claimable Checks | ❌ |
| Basic | $1,000 | Direct Payments | ✅ |
| Verified | Unlimited | Direct Payments | ✅ |

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + shadcn/ui
- **xrpl.js** v3.1
- **XRPL Testnet**

## ✨ Features

### Core Functionality
- 🔐 **Wallet Management** - Create or import XRPL wallets with AES-256 encrypted storage
- 💵 **RLUSD Integration** - Full support for Ripple's USD stablecoin
- ⚡ **Direct Payments** - Send RLUSD instantly (for verified users)
- 📝 **Claimable Checks** - Create checks that recipients can claim (for unverified users)
- 🆔 **DID Verification** - On-chain identity for higher limits
- 📜 **Transaction History** - View all sent/received transactions
- 💬 **Personal Messages** - Attach notes via XRPL memos
- 📱 **QR Code Sharing** - Easy address sharing

### RWA Marketplace
- 🏭 **Tokenize Assets** - Create RWA tokens with rich metadata
- 🌍 **Global Transfer** - Send RWA tokens worldwide instantly
- 📊 **Portfolio View** - Track your tokenized asset holdings
- 🛒 **Marketplace** - Browse available RWA tokens
- 🔒 **Compliance** - Verification required for issuance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Path-yang/SigmaPay.git

# Navigate to the project
cd SigmaPay

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 📱 Usage Guide

### 1. Create a Wallet
1. Click **"Get Started"** on the landing page
2. Choose **"Create New"** or import existing
3. Set a secure password
4. **⚠️ SAVE YOUR SEED PHRASE**

### 2. Fund Your Wallet
1. Click **"Fund Wallet"** on dashboard
2. Wait for testnet XRP (~10 XRP)

### 3. Enable RLUSD (Optional)
1. Click **"Enable RLUSD"**
2. Creates trustline to RLUSD issuer

### 4. Verify Identity (Recommended)
1. Go to **Verify** page
2. Enter name, email, phone
3. Choose Basic ($1,000) or Full (Unlimited)

### 5. Send a Payment
1. Go to **Send** page
2. Enter amount and recipient address
3. Add optional message
4. Confirm and send!

### 6. Tokenize an Asset (NEW!)
1. Go to **RWA Marketplace** → **Tokenize Asset**
2. Select asset category (Real Estate, Commodities, etc.)
3. Fill in asset details (name, description, value)
4. Create token on XRPL
5. Send tokens to anyone globally!

### 7. Receive RWA Tokens
1. Create trustline to the asset issuer (automatic on receive)
2. Receive tokenized assets from anywhere in the world
3. View in your **RWA Portfolio**

## 🏗 Architecture

```
SigmaPay/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── onboarding/           # Wallet setup + DID
│   ├── dashboard/            # Main dashboard
│   ├── send/                 # Send flow
│   ├── receive/              # Receive & claim
│   ├── history/              # Transaction history
│   ├── verify/               # DID verification
│   ├── rwa/                  # RWA Marketplace
│   └── tokenize/             # Tokenize assets
├── components/
│   ├── ui/                   # shadcn components
│   ├── wallet/               # Wallet components
│   ├── did/                  # DID components
│   ├── send/                 # Send components
│   ├── receive/              # Receive components
│   ├── rwa/                  # RWA components
│   └── common/               # Shared components
├── lib/
│   ├── xrpl/                 # XRPL integration
│   │   ├── client.ts
│   │   ├── did.ts            # DID operations
│   │   ├── payments.ts
│   │   ├── checks.ts
│   │   ├── trustline.ts
│   │   └── rwa.ts            # RWA tokenization
│   ├── utils/
│   └── hooks/
└── types/
```

## 🔗 XRPL Configuration

```typescript
// Network
XRPL_TESTNET_URL = "wss://s.altnet.rippletest.net:51233"

// RLUSD (40-char hex encoding for 5+ char currencies)
RLUSD_ISSUER = "rQhWct2fTR6gPgmc8sLMdM6U8Lwrjvzzyj"
RLUSD_CURRENCY = "524C555344000000000000000000000000000000"

// Explorer
EXPLORER_BASE_URL = "https://testnet.xrpl.org"
```

## 🔐 Security

| Aspect | Implementation |
|--------|----------------|
| **Seed Storage** | AES-256 encrypted in localStorage |
| **Password** | Never stored; used only for encryption |
| **Signing** | All signing happens client-side |
| **Keys** | Never leave the browser |
| **RWA Issuance** | Verification required |

> ⚠️ **Hackathon MVP**: For production, consider hardware wallets, multi-sig, and secure enclave storage.

## 🗺 Roadmap

### Phase 1: MVP (Current) ✅
- [x] Wallet creation/import
- [x] RLUSD integration
- [x] Direct payments
- [x] Claimable checks
- [x] DID verification
- [x] Permissioned flows
- [x] Transaction history
- [x] Mobile-responsive UI
- [x] **RWA Marketplace**
- [x] **Asset Tokenization**
- [x] **Global RWA Transfer**

### Phase 2: Enhanced Features
- [ ] Multi-currency support
- [ ] Contact book
- [ ] Push notifications
- [ ] Recurring payments
- [ ] RWA fractional trading

### Phase 3: Institutional
- [ ] Multi-signature wallets
- [ ] Business API
- [ ] Compliance tools
- [ ] Fiat on/off ramps
- [ ] RWA marketplace with order book

## 🌐 Resources

- [Ripple DevRel Resources](https://linktr.ee/rippledevrel)
- [RLUSD Stablecoin Faucet](https://tryrlusd.com)
- [XRPL Documentation](https://xrpl.org/docs)
- [XRPL Testnet Explorer](https://testnet.xrpl.org)

## 👥 Team

**NUS FinTech Summit 2026 Hackathon**

## 📄 License

MIT License - see LICENSE file for details.

---

<div align="center">

**Built with 💜 for the NUS FinTech Summit 2026 Hackathon**

Powered by [XRP Ledger](https://xrpl.org) • [RLUSD](https://ripple.com)

</div>
