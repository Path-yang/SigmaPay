# SigmaPay Σ

> Cross-border payments made simple. Send money home instantly with near-zero fees.

**SigmaPay** is a modern web application that leverages the XRP Ledger (XRPL) to enable fast, low-cost cross-border remittances using RLUSD stablecoin.

## 🌟 Features

### Core Functionality
- **Wallet Management**: Create or import XRPL wallets with secure encrypted storage
- **RLUSD Integration**: Full support for Ripple's USD stablecoin on XRPL Testnet
- **Direct Payments**: Send RLUSD instantly to any XRPL address
- **Claimable Checks**: Create checks that recipients can claim when ready
- **Transaction History**: View all sent and received transactions
- **Personal Messages**: Attach notes to your payments via XRPL memos

### Technical Highlights
- **4-second finality**: Transactions confirm in seconds, not days
- **Near-zero fees**: Pay less than $0.01 per transaction
- **Trustlines**: Automatic RLUSD trustline setup
- **QR Codes**: Easy address sharing for receiving payments

## 🚀 XRPL Features Used

| Feature | Usage |
|---------|-------|
| **RLUSD Stablecoin** | Primary currency for all remittances |
| **Trustlines** | Enable RLUSD on user wallets |
| **Payments** | Direct peer-to-peer transfers |
| **Checks** | Claimable payment vouchers |
| **Memos** | Personal messages attached to transactions |
| **Testnet Faucet** | Easy wallet funding for demos |

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **XRPL**: xrpl.js v3
- **Wallet Security**: crypto-js AES encryption
- **Deployment**: Vercel-ready

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-team/SigmaPay.git
cd SigmaPay/remitgift

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🔧 Configuration

The app connects to XRPL Testnet by default. No API keys or secrets required.

### RLUSD Testnet Details
- **Issuer**: `rQhWct2fTR6gPgmc8sLMdM6U8Lwrjvzzyj`
- **Currency Code**: `RLUSD`
- **Network**: XRPL Testnet (`wss://s.altnet.rippletest.net:51233`)

## 📱 Usage Guide

### Getting Started
1. Visit the app and click "Get Started"
2. Create a new wallet or import an existing one
3. Set a password to encrypt your wallet locally
4. **Save your seed phrase securely!**

### Funding Your Wallet
1. Click "Fund Wallet" on the dashboard
2. Wait for testnet XRP to arrive (~10 XRP)
3. Click "Enable RLUSD" to create the trustline

### Sending a Payment
1. Navigate to "Send" 
2. Enter the amount in SGD (converts 1:1 to RLUSD)
3. Enter the recipient's XRPL address
4. Optionally add a personal message
5. Choose direct payment or claimable check
6. Confirm and send!

### Receiving Payments
1. Share your wallet address or QR code
2. Claim any pending checks in the "Receive" tab

## 🏗 Project Structure

```
SigmaPay/
└── remitgift/
    ├── app/                    # Next.js App Router pages
    │   ├── dashboard/          # Main dashboard
    │   ├── send/               # Send payment flow
    │   ├── receive/            # Receive & claim checks
    │   └── history/            # Transaction history
    ├── components/
    │   ├── ui/                 # shadcn/ui components
    │   ├── wallet/             # Wallet management
    │   ├── send/               # Send form components
    │   ├── receive/            # Receive components
    │   └── common/             # Shared components
    ├── lib/
    │   ├── xrpl/               # XRPL integration
    │   │   ├── client.ts       # Connection management
    │   │   ├── wallet.ts       # Wallet operations
    │   │   ├── payments.ts     # Send payments
    │   │   ├── checks.ts       # Create/cash checks
    │   │   ├── trustline.ts    # RLUSD trustline
    │   │   └── balance.ts      # Get balances
    │   └── utils/              # Helpers
    └── types/                  # TypeScript types
```

## 🔐 Security

- Wallet seeds are encrypted with AES-256 before localStorage storage
- Passwords are never stored; used only for encryption/decryption
- All XRPL transactions are signed client-side
- No backend servers or custody of funds

> ⚠️ **Note**: This is a hackathon MVP. For production use, consider hardware wallets or institutional custody solutions.

## 🎯 Problem Statement

Cross-border remittances are expensive and slow:
- Traditional services charge 5-10% in fees
- Transfers take 2-5 business days
- Recipients lose value to poor exchange rates

**SigmaPay solves this** by using XRPL's RLUSD stablecoin:
- ✅ Near-instant settlement (3-5 seconds)
- ✅ Negligible fees (<$0.01)
- ✅ Stable USD value
- ✅ Direct wallet-to-wallet transfers

## 📹 Demo

[Link to demo video coming soon]

## 👥 Team

**NUS FinTech Summit 2026 Hackathon**

- [Team Member 1]
- [Team Member 2]
- [Team Member 3]

## 📄 License

MIT License - feel free to use this code for your own projects!

---

Built with 💜 for the NUS FinTech Summit 2026 Hackathon

Powered by [XRPL](https://xrpl.org) | [Ripple](https://ripple.com)
