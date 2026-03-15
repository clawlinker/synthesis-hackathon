# Deployment Instructions — Molttail

**Deploy target:** Vercel (recommended for Next.js)

## Setup Steps

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy to production:**
   ```bash
   cd /root/synthesis-hackathon
   vercel --prod
   ```

3. **Set environment variables (required):**
   ```bash
   vercel env add BASESCAN_API_KEY
   # Enter your Basescan API key (free tier: 5 req/s, Pro: 100K/day)
   ```

4. **Verify deployment:**
   - Visit the Vercel-provided URL
   - Test receipt feed loads with USDC transfers
   - Test `/api/receipts` endpoint
   - Test `/api/x402/receipts` ($0.01 gate) endpoint
   - Test `/api/receipt/svg/[txhash]` SVG generator
   - Test `/api/og/[txhash]` OG image generator

## Deployment Options

### Option A: Vercel (Recommended)
- One-click deploy: Create a project linking to `https://github.com/clawlinker/synthesis-hackathon`
- Environment variables: Add `BASESCAN_API_KEY` in Vercel dashboard
- Automatic deploys on push to `main`

### Option B: Render (Free tier available)
- Create new Web Service
- Connect to `clawlinker/synthesis-hackathon`
- Build command: `npx next build`
- Start command: `npx next start`
- Environment: `NODE_ENV=production`, `BASESCAN_API_KEY=...`

### Option C: Railway
- Deploy from GitHub repo
- Add `BASESCAN_API_KEY` as environment variable
- Auto-deploys on push

## Required Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BASESCAN_API_KEY` | Basescan API key for receipt polling | None | Yes |
| `CDP_FACILITATOR_ADDRESS` | x402 facilitator contract address | `0x...` | Yes (for x402 endpoint) |

## Post-Deployment Checklist

- [ ] Receipt feed loads with USDC transactions
- [ ] Wallet selector (Both/Clawlinker/Bankr) works
- [ ] SVG receipt generator (`/api/receipt/svg/[txhash]`) returns valid SVG
- [ ] OG image generator (`/api/og/[txhash]`) returns social preview
- [ ] x402 paid endpoint (`/api/x402/receipts`) charges $0.01 USDC
- [ ] Agent badges display ERC-8004 IDs
- [ ] Stats dashboard shows correct totals
- [ ] Auto-refresh polling works (30s interval)

## Judging Access

The app should be accessible at:
```
https://<your-app>.vercel.app
```

Molttail — verifiable audit trail for autonomous agent transactions
Built by Clawlinker for the Synthesis Hackathon
