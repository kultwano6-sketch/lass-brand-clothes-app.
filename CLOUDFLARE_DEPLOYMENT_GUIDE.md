# LASS Brand Clothes – Cloudflare Workers Deployment Guide (100% Free Plan)

This guide provides step-by-step instructions for deploying the **LASS Brand Clothes** e-commerce app to **Cloudflare Workers** on the **Free Plan** (no credit card required, 100,000 requests/day).

---

## 🏗️ Architecture Overview

The application has been adapted from a standalone Node/Express server into an edge-native Cloudflare Workers architecture:

1. **Frontend (Vite + React SPA)**:
   - Built to `./dist`.
   - Served globally via Cloudflare Workers Static Assets (`env.ASSETS`) with client-side SPA routing (`not_found_handling = "single-page-application"`).
2. **Backend API (`src/worker.ts`)**:
   - Handles all PayFast hosted checkout requests (`/api/payfast/create-checkout`).
   - Generates authentic MD5 signatures server-side so your PayFast Merchant Key and Passphrase are never exposed to the browser.
   - Receives and cryptographically verifies PayFast Instant Transaction Notifications (`/api/payfast/notify`).
   - Validates payment status idempotently and updates order status.
   - Disables the sandbox simulation endpoint in production (`PAYFAST_SANDBOX="false"`).
3. **Database (Cloudflare Workers KV)**:
   - Replaces the local Node.js filesystem `data/orders.json` with Cloudflare Workers KV (`ORDERS_KV`).
   - 100% free tier: 100,000 reads/day, 1,000 writes/day, 1 GB storage.
   - Includes graceful in-memory fallback for local preview and testing.

---

## 📱 Android Phone Step-by-Step Deployment Instructions

You can complete the entire setup and deployment from your Android phone using your mobile browser (Chrome, Brave, or Samsung Internet) without needing a desktop computer.

### Step 1: Sign Up or Log In to Cloudflare (Free)
1. On your phone, open your browser and go to [dash.cloudflare.com](https://dash.cloudflare.com).
2. Create a free account or log in.
3. When prompted for plans, select the **Free Plan** ($0 / month). **No credit card is required.**

---

### Step 2: Create your KV Namespace for Persistent Orders
1. In the Cloudflare dashboard, tap the **☰ (Menu)** icon at the top left.
2. Navigate to **Workers & Pages** ➔ **KV**.
3. Tap **Create a namespace**.
4. Name the namespace: `ORDERS_KV`.
5. Tap **Add**.
6. Cloudflare will display your new namespace along with a **Namespace ID** (a 32-character hex string, e.g. `6b9f291e0a8449cfa74b123456789abc`).
7. Copy this **Namespace ID** (you will bind it in Step 4 or put it in `wrangler.toml`).

---

### Step 3: Deploy via Cloudflare Dashboard or GitHub Actions

#### Option A: Connect your GitHub Repository (Recommended for Mobile)
1. In Cloudflare Dashboard, tap **Workers & Pages** ➔ **Create application** ➔ **Pages** or **Workers**.
2. Select **Connect to Git** (GitHub).
3. Authorize Cloudflare to access your GitHub repository where `lass-brand-clothes` is pushed.
4. Select your repository and configure build settings:
   - **Framework Preset**: `None` / `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Alternatively, use the included GitHub Actions workflow (`.github/workflows/deploy.yml`):
   - In GitHub on your phone, go to your repository **Settings** ➔ **Secrets and variables** ➔ **Actions**.
   - Add two repository secrets:
     - `CLOUDFLARE_API_TOKEN`: Created in Cloudflare Dashboard under **My Profile** ➔ **API Tokens** ➔ **Edit Cloudflare Workers** template.
     - `CLOUDFLARE_ACCOUNT_ID`: Shown on your Cloudflare Workers overview page.
   - Every time you commit or push code, GitHub Actions automatically builds and deploys your worker!

#### Option B: Deploy using Wrangler CLI on Termux (Android Command Line)
If you use **Termux** on Android:
```bash
# 1. Install Node.js & Git
pkg update && pkg install nodejs git

# 2. Clone your repository
git clone <YOUR_GITHUB_REPO_URL>
cd lass-brand-clothes

# 3. Install dependencies and build
npm install
npm run build

# 4. Log in to Cloudflare
npx wrangler login

# 5. Deploy to Cloudflare Workers
npx wrangler deploy
```

---

### Step 4: Add PayFast Secrets to your Cloudflare Worker

To ensure your live PayFast credentials are secure and never committed to GitHub or exposed in frontend code:

1. In Cloudflare Dashboard, tap **Workers & Pages**.
2. Tap your worker: `lass-brand-clothes-app`.
3. Tap the **Settings** tab.
4. Scroll to **Variables and Secrets**.
5. Tap **Add** under **Secrets**:
   - Name: `PAYFAST_PASSPHRASE` ➔ Encrypted secret (declared in `wrangler.toml` under `[secrets] required = ["PAYFAST_PASSPHRASE"]`)
   - (When switching from sandbox to live): `PAYFAST_MERCHANT_ID` and `PAYFAST_MERCHANT_KEY`
6. Under **Environment Variables** (plain text):
   - Name: `PAYFAST_SANDBOX` ➔ Value: `true` (for testing) or `false` (for live PayFast)
   - Name: `APP_URL` ➔ Value: `https://lass-brand-clothes-app.harvestkelass.workers.dev`
   - Name: `ALLOW_SANDBOX_SIMULATION` ➔ Value: `false`
7. Tap **Deploy** / **Save**.

---

### Step 5: Bind the KV Namespace in Cloudflare Dashboard

1. Still in your Worker's **Settings** tab, scroll to **Bindings**.
2. Tap **Add binding** ➔ Select **KV Namespace**.
3. **Variable name**: Enter `ORDERS_KV` (must match exactly).
4. **KV namespace**: Select the `ORDERS_KV` namespace (ID: `b874fd0a49a849fb94922f46080e1509`).
5. Tap **Save and deploy**.

---

### Step 6: Configure your PayFast Merchant Dashboard

1. Log in to [payfast.io](https://www.payfast.io) or [sandbox.payfast.co.za](https://sandbox.payfast.co.za).
2. Go to **Settings** ➔ **Integration**.
3. Under **Security Passphrase**, ensure your passphrase matches:
   `HARVEST KE LASS`
4. Set the **Notify URL** to:
   `https://lass-brand-clothes-app.harvestkelass.workers.dev/api/payfast/notify`
5. Save changes.

---

## 🔒 Security & Payment Integrity Verification

- **No Browser-Only Approvals**: Orders are only marked as `paid` when an authenticated ITN is received from PayFast with matching cryptographic MD5 signature and matching order amount.
- **Production Simulation Disabled**: `/api/payfast/simulate-sandbox-itn` is strictly blocked in production (`403 Forbidden`).
- **Secrets Kept Server-Side**: All PayFast credentials remain inside Cloudflare Worker encrypted secrets and are never sent to the client browser.
- **Persistent KV Records**: Every order and ITN transaction record is saved in Cloudflare Workers KV.
