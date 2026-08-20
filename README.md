# Split — pay your share on Stellar

A tab-splitting dApp for the **Stellar Journey to Mastery — Level 1 (White Belt)** challenge.
Someone fronts the bill, you add the people who were there, and everyone pays their exact
share in XLM on the Stellar testnet — no spreadsheets, no "I'll get you back."

The whole UI is designed as a single printed receipt: dotted line-item leaders, a torn
paper edge, and a rubber-stamp "SETTLED" mark that drops in once your payment confirms.

## What it does

- Connects and disconnects a **Freighter** wallet (testnet only)
- Fetches and displays the connected wallet's **XLM balance**, live from Horizon
- One-click **Friendbot** funding for brand-new testnet accounts
- Lets you enter a bill total, the address of whoever fronted it, and a list of people
  splitting it (each with adjustable "shares" for uneven splits)
- Computes each person's exact share and shows it as an itemized receipt
- Builds, signs (via Freighter), and submits a real **XLM payment transaction** on
  Stellar testnet
- Shows a clear success/failure state with the transaction hash, a link to
  Stellar Expert, and a scannable QR code of the confirmation

## Tech stack

- [Vite](https://vite.dev/) + React + TypeScript
- [`@stellar/freighter-api`](https://www.npmjs.com/package/@stellar/freighter-api) for wallet connect/sign
- [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk) for building transactions and talking to Horizon
- Plain CSS (no framework) — the design system lives in `src/index.css`

## Setup instructions (run it locally)

**Prerequisites**

- [Node.js](https://nodejs.org/) 18 or newer
- The [Freighter](https://www.freighter.app/) browser extension, installed and set to
  **Testnet** (Freighter menu → Settings → Network → Testnet)

**Steps**

```bash
# 1. Clone your copy of this repo
git clone <your-repo-url>
cd stellar-split

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). Click **Connect Freighter**,
approve the popup, and you're in.

If your Freighter account has no testnet XLM yet, the app will show a **Fund with
Friendbot** button — click it to get free testnet XLM instantly.

**Build for production**

```bash
npm run build
npm run preview   # serve the production build locally
```

## How to try the full flow

1. Connect Freighter (make sure it's on Testnet).
2. If your balance shows "unfunded," click **Fund with Friendbot**.
3. Enter a bill total, e.g. `20`.
4. Enter a recipient address — this is who "fronted the bill" and will receive the
   payment. For a real test, use a **second** Freighter account (or any testnet
   `G...` address) so you can watch its balance go up.
5. Add the people splitting the bill and pick which one is "you."
6. Review the itemized split, then click **Send my share**.
7. Approve the transaction in the Freighter popup.
8. Watch the receipt print a **SETTLED** stamp with the transaction hash and QR code.

## Project structure

```
src/
  App.tsx                    # composes the receipt layout
  index.css                  # design tokens + all styling
  lib/stellar.ts             # Freighter + Horizon integration (connect, balance, payment)
  hooks/useWallet.ts         # wallet connection state
  components/
    WalletLine.tsx           # connect/disconnect + balance + Friendbot
    BillItems.tsx            # bill total, recipient, participants
    SplitSummary.tsx         # itemized receipt lines
    PaySection.tsx           # builds & sends the payment
    TransactionStamp.tsx     # success/failure stamp, hash, QR
```

## Screenshots

> Add your own screenshots here before submitting, showing:
> - Wallet connected state
> - Balance displayed
> - A successful testnet transaction
> - The transaction result shown to the user

| Wallet connected | Split calculated | Transaction settled |
| --- | --- | --- |
| _screenshot_ | _screenshot_ | _screenshot_ |

## Notes

- This app talks **only** to Stellar **testnet** (`horizon-testnet.stellar.org`). It will
  refuse to proceed if Freighter is set to a different network.
- No private keys ever touch this app's code — all signing happens inside the Freighter
  extension.

---

Built for the [Stellar Journey to Mastery](https://stellar.org/) — Level 1, White Belt.
