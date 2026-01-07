# RemitGift 🎁💸

> Send money home instantly. No hidden fees. Verified & secure.

## 🎯 Problem

Sending small amounts of money internationally (remittances) is expensive due to high flat fees and slow processing times. Migrant workers often pay 5-10% in fees just to send money to their families.

## 💡 Solution

RemitGift is a mobile-first web app that leverages the XRP Ledger to enable instant, low-cost international transfers using RLUSD stablecoin. With built-in decentralized identity (DID) verification, users get higher limits and instant transfers while maintaining compliance.

## 🔧 XRPL Features Used

| Feature | How We Use It |
|---------|---------------|
| **RLUSD** | Core payment currency - stable USD value |
| **Payments** | Direct instant transfers for verified users |
| **Checks** | Claimable payments for unverified users |
| **DID** | On-chain identity verification |
| **Credentials** | Permissioned flows based on verification level |
| **Memos** | Personal messages attached to transfers |

## 🔐 Verification Levels

| Level | Send Limit | Payment Method |
|-------|------------|----------------|
| Unverified | $100 | Claimable Checks |
| Basic | $1,000 | Direct Payments |
| Verified | Unlimited | Direct Payments |

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

### Verification Tiers
- **Unverified**: $100 limit, sends via Checks
- **Basic Verified**: $1,000 limit, direct payments
- **Fully Verified**: Unlimited, instant transfers

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

### 3. Enable RLUSD
1. Click **"Enable RLUSD"**
2. Creates trustline to RLUSD issuer

### 4. Verify Identity (Optional but Recommended)
1. Go to **Verify** page
2. Enter name, email, phone
3. Choose Basic ($1,000) or Full (Unlimited)

### 5. Send a Payment
1. Go to **Send** page
2. Enter amount and recipient address
3. Add optional message
4. Confirm and send!

## 🏗 Architecture

```
remitgift/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── onboarding/           # Wallet setup + DID
│   ├── dashboard/            # Main dashboard
│   ├── send/                 # Send flow
│   ├── receive/              # Receive & claim
│   ├── history/              # Transaction history
│   └── verify/               # DID verification
├── components/
│   ├── ui/                   # shadcn components
│   ├── wallet/               # Wallet components
│   ├── did/                  # DID components
│   ├── send/                 # Send components
│   ├── receive/              # Receive components
│   └── common/               # Shared components
├── lib/
│   ├── xrpl/                 # XRPL integration
│   │   ├── client.ts
│   │   ├── did.ts            # DID operations
│   │   ├── payments.ts
│   │   ├── checks.ts
│   │   └── trustline.ts
│   ├── utils/
│   └── hooks/
└── types/
```

## 🔗 XRPL Configuration

```typescript
// Network
XRPL_TESTNET_URL = "wss://s.altnet.rippletest.net:51233"

// RLUSD
RLUSD_ISSUER = "rQhWct2fTR6gPgmc8sLMdM6U8Lwrjvzzyj"
RLUSD_CURRENCY = "RLUSD"

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

### Phase 2: Enhanced Features
- [ ] Multi-currency support
- [ ] Contact book
- [ ] Push notifications
- [ ] Recurring payments

### Phase 3: Institutional
- [ ] Multi-signature wallets
- [ ] Business API
- [ ] Compliance tools
- [ ] Fiat on/off ramps

## 👥 Team

**NUS FinTech Summit 2026 Hackathon**

## 📄 License

MIT License - see LICENSE file for details.

---

<div align="center">

**Built with 💜 for the NUS FinTech Summit 2026 Hackathon**

Powered by [XRP Ledger](https://xrpl.org) • [RLUSD](https://ripple.com)

</div>
