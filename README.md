# SigmaPay Σ

<div align="center">

![SigmaPay Logo](https://img.shields.io/badge/SigmaPay-Σ-6366f1?style=for-the-badge&logoColor=white)

**Cross-border payments made simple. Send money home instantly with near-zero fees.**

[![Built on XRPL](https://img.shields.io/badge/Built%20on-XRPL-blue?style=flat-square)](https://xrpl.org)
[![RLUSD](https://img.shields.io/badge/Currency-RLUSD-green?style=flat-square)](https://ripple.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

[Live Demo](https://sigma-pay.vercel.app) • [Documentation](#-documentation) • [Features](#-features) • [Quick Start](#-quick-start)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [XRPL Integration](#-xrpl-integration)
- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
- [Architecture](#-architecture)
- [Security](#-security)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [Team](#-team)
- [License](#-license)

---

## 🌟 Overview

**SigmaPay** is a modern web application that leverages the XRP Ledger (XRPL) to enable fast, low-cost cross-border remittances using RLUSD stablecoin. Built for the **NUS FinTech Summit 2026 Hackathon**, SigmaPay demonstrates how blockchain technology can revolutionize international money transfers.

### Key Highlights

| Metric | Traditional Remittance | SigmaPay |
|--------|----------------------|----------|
| **Speed** | 2-5 business days | 3-5 seconds |
| **Fees** | 5-10% | < $0.01 |
| **Availability** | Business hours | 24/7/365 |
| **Transparency** | Hidden fees | Full transparency |

---

## 🎯 Problem Statement

Cross-border remittances are a **$700+ billion market** plagued by inefficiencies:

### The Pain Points

1. **Expensive Fees** 💸
   - Traditional services charge 5-10% in fees
   - Hidden exchange rate markups add another 2-5%
   - Minimum transaction fees make small transfers impractical

2. **Slow Transfers** 🐌
   - Bank wires take 2-5 business days
   - Weekend/holiday delays extend wait times
   - Funds may be held for compliance checks

3. **Limited Access** 🚫
   - Requires bank accounts (1.4 billion adults are unbanked)
   - Complex documentation requirements
   - Limited operating hours

4. **Lack of Transparency** 🔍
   - Hidden fees in exchange rates
   - Unclear delivery times
   - No real-time tracking

---

## 💡 Our Solution

**SigmaPay** uses the XRP Ledger and RLUSD stablecoin to solve these problems:

### How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Sender    │────▶│    XRPL     │────▶│  Receiver   │
│  (SigmaPay) │     │  (3-5 sec)  │     │  (SigmaPay) │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
   RLUSD              Trustline           RLUSD
   Payment            + Memo              Received
```

### Why XRPL + RLUSD?

- **RLUSD (Ripple USD)**: A fully-backed USD stablecoin, eliminating crypto volatility
- **XRP Ledger**: 12+ years of reliability, 4-second finality, eco-friendly consensus
- **Low Fees**: Transactions cost fractions of a cent
- **Global Reach**: Accessible from anywhere with internet

---

## ✨ Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| 🔐 **Wallet Management** | Create or import XRPL wallets with AES-256 encrypted local storage |
| 💵 **RLUSD Integration** | Full support for Ripple's USD stablecoin with automatic trustline setup |
| ⚡ **Direct Payments** | Send RLUSD instantly to any XRPL address worldwide |
| 📝 **Claimable Checks** | Create checks that recipients can claim at their convenience |
| 📜 **Transaction History** | View all sent/received transactions with explorer links |
| 💬 **Personal Messages** | Attach notes to your payments via XRPL memos |
| 📱 **QR Code Sharing** | Easy address sharing for receiving payments |

### User Experience

- **Mobile-First Design**: Responsive UI that works on any device
- **Modern Aesthetics**: Glassmorphism, gradients, and smooth animations
- **Intuitive Flow**: Multi-step forms with progress indicators
- **Real-Time Feedback**: Toast notifications for all actions
- **Dark Mode Ready**: Supports system color preferences

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org) | 14 | React framework with App Router |
| [TypeScript](https://typescriptlang.org) | 5 | Type-safe JavaScript |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com) | Latest | Accessible UI components |
| [Radix UI](https://radix-ui.com) | Latest | Headless UI primitives |
| [Lucide Icons](https://lucide.dev) | Latest | Beautiful icons |

### Blockchain

| Technology | Version | Purpose |
|------------|---------|---------|
| [xrpl.js](https://js.xrpl.org) | 4.5 | XRPL JavaScript client |
| [XRPL Testnet](https://testnet.xrpl.org) | - | Development network |
| [RLUSD](https://ripple.com) | - | USD stablecoin |

### Security

| Technology | Purpose |
|------------|---------|
| [crypto-js](https://github.com/brix/crypto-js) | AES-256 wallet encryption |
| Client-side signing | Keys never leave the browser |

---

## 🔗 XRPL Integration

### Features Used

```typescript
// XRPL Features Implemented in SigmaPay

1. Wallet Generation & Import
   - Wallet.generate()
   - Wallet.fromSeed()

2. Testnet Faucet
   - client.fundWallet()

3. Trust Lines (RLUSD)
   - TransactionType: "TrustSet"
   - Currency: RLUSD
   - Issuer: rQhWct2fTR6gPgmc8sLMdM6U8Lwrjvzzyj

4. Direct Payments
   - TransactionType: "Payment"
   - Amount: { currency: RLUSD, value, issuer }

5. Checks (Claimable Payments)
   - TransactionType: "CheckCreate"
   - TransactionType: "CheckCash"

6. Memos (Personal Messages)
   - Memo: { MemoType, MemoData }

7. Account Queries
   - account_info
   - account_lines
   - account_objects
   - account_tx
```

### Network Configuration

```typescript
// lib/xrpl/constants.ts
export const XRPL_TESTNET_URL = "wss://s.altnet.rippletest.net:51233";
export const RLUSD_ISSUER = "rQhWct2fTR6gPgmc8sLMdM6U8Lwrjvzzyj";
export const RLUSD_CURRENCY = "RLUSD";
export const EXPLORER_BASE_URL = "https://testnet.xrpl.org";
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

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

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd remitgift
vercel --prod
```

---

## 📱 Usage Guide

### 1. Create a Wallet

1. Click **"Get Started"** on the landing page
2. Choose **"Create New"** (or import existing)
3. Set a secure password (min 6 characters)
4. **⚠️ SAVE YOUR SEED PHRASE** - you'll need it to recover your wallet

### 2. Fund Your Wallet

1. On the dashboard, click **"Fund Wallet"**
2. Wait for testnet XRP to arrive (~10 XRP)
3. Your balance will update automatically

### 3. Enable RLUSD

1. Click **"Enable RLUSD"** button
2. This creates a trustline to the RLUSD issuer
3. You can now send and receive RLUSD

### 4. Send a Payment

1. Go to **"Send"** page
2. Enter amount (in SGD, converts 1:1 to RLUSD)
3. Enter recipient's XRPL address
4. Add an optional personal message
5. Choose **Direct Payment** or **Claimable Check**
6. Confirm and send!

### 5. Receive Payments

1. Go to **"Receive"** page
2. Share your wallet address or QR code
3. Claim any pending checks

---

## 🏗 Architecture

### Project Structure

```
SigmaPay/
└── 
    ├── app/                          # Next.js App Router
    │   ├── page.tsx                  # Landing page
    │   ├── layout.tsx                # Root layout
    │   ├── globals.css               # Global styles
    │   ├── dashboard/page.tsx        # Main dashboard
    │   ├── send/page.tsx             # Send payment flow
    │   ├── receive/page.tsx          # Receive & claim
    │   └── history/page.tsx          # Transaction history
    │
    ├── components/
    │   ├── ui/                       # shadcn/ui components
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── input.tsx
    │   │   ├── toast.tsx
    │   │   └── ...
    │   ├── wallet/                   # Wallet components
    │   │   ├── WalletProvider.tsx    # Context & state
    │   │   ├── WalletSetup.tsx       # Create/import
    │   │   ├── WalletUnlock.tsx      # Password unlock
    │   │   └── WalletBalance.tsx     # Balance display
    │   ├── send/
    │   │   └── SendForm.tsx          # Multi-step send
    │   ├── receive/
    │   │   ├── ReceiveAddress.tsx    # QR code
    │   │   └── ChecksList.tsx        # Pending checks
    │   ├── common/
    │   │   ├── Navbar.tsx            # Navigation
    │   │   ├── TransactionHistory.tsx
    │   │   └── ExplorerLink.tsx
    │   └── landing/
    │       └── Hero.tsx              # Landing hero
    │
    ├── lib/
    │   ├── xrpl/                     # XRPL integration
    │   │   ├── client.ts             # Singleton client
    │   │   ├── constants.ts          # Network config
    │   │   ├── wallet.ts             # Wallet ops
    │   │   ├── balance.ts            # Get balances
    │   │   ├── payments.ts           # Send payments
    │   │   ├── checks.ts             # Create/cash checks
    │   │   ├── trustline.ts          # RLUSD trustline
    │   │   └── transactions.ts       # Tx history
    │   └── utils/
    │       ├── encryption.ts         # AES encryption
    │       └── format.ts             # Formatting helpers
    │
    └── types/
        └── index.ts                  # TypeScript types
```

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                      React UI                           │
│  (Components: Wallet, Send, Receive, History)           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  WalletProvider                         │
│  (Context: address, wallet, balances, actions)          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    lib/xrpl/*                           │
│  (Client, Payments, Checks, Trustline, Balance)         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    XRPL Testnet                         │
│  (WebSocket: wss://s.altnet.rippletest.net:51233)       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security

### Wallet Security

| Aspect | Implementation |
|--------|----------------|
| **Seed Storage** | AES-256 encrypted in localStorage |
| **Password** | Never stored; used only for encryption/decryption |
| **Transaction Signing** | All signing happens client-side |
| **Key Transmission** | Keys never leave the browser |

### Code Example

```typescript
// Wallet encryption (lib/utils/encryption.ts)
export function encryptSeed(seed: string, password: string): string {
  return CryptoJS.AES.encrypt(seed, password).toString();
}

export function decryptSeed(encrypted: string, password: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, password);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

### Security Notes

> ⚠️ **Hackathon MVP Disclaimer**: This is a proof-of-concept for educational purposes. For production use:
> - Consider hardware wallet integration
> - Implement multi-signature support
> - Add biometric authentication
> - Use secure enclave storage on mobile

---

## 📸 Screenshots

### Landing Page
Modern hero section with animated gradients and clear value proposition.

### Dashboard
Wallet balance display with quick action buttons for Send, Receive, and History.

### Send Flow
Multi-step form with progress indicator, amount input, recipient selection, and confirmation.

### Receive
QR code for easy sharing and list of pending claimable checks.

---

## 🗺 Roadmap

### Phase 1: MVP (Current) ✅
- [x] Wallet creation/import
- [x] RLUSD integration
- [x] Direct payments
- [x] Claimable checks
- [x] Transaction history
- [x] Mobile-responsive UI

### Phase 2: Enhanced Features
- [ ] Multi-currency support
- [ ] Contact book / address labels
- [ ] Push notifications
- [ ] Recurring payments
- [ ] Payment requests

### Phase 3: Institutional
- [ ] Multi-signature wallets
- [ ] API for businesses
- [ ] Compliance tools
- [ ] Fiat on/off ramps

---

## 👥 Team

**NUS FinTech Summit 2026 Hackathon**

| Name | Role | GitHub |
|------|------|--------|
| Team Member 1 | Full Stack Developer | @github |
| Team Member 2 | Blockchain Developer | @github |
| Team Member 3 | UI/UX Designer | @github |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 SigmaPay Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 🙏 Acknowledgments

- **Ripple** - For XRPL and RLUSD
- **NUS FinTech Society** - For organizing the hackathon
- **UBRI** - University Blockchain Research Initiative
- **shadcn/ui** - For the beautiful component library

---

<div align="center">

**Built with 💜 for the NUS FinTech Summit 2026 Hackathon**

[⬆ Back to Top](#sigmapay-σ)

</div>
