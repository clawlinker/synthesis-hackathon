# UI Review — Element-by-Element Audit

_Every element must justify its existence. Every card must make sense on its own._

**Rules for reviewers:**
1. Does this element serve the user? If not → remove or hide
2. Is this the best way to show this info? If not → redesign
3. Does it look polished on mobile AND desktop? If not → fix
4. Is the copy clear? No jargon, no filler, no placeholder text

---

## Homepage (`app/page.tsx`)

### Hero Section
- [ ] **"Molttail v1.0" badge** — Is version number useful to judges/users? Maybe just "Molttail" or "Live"
- [ ] **Headline copy** — "Every payment your agent makes, verified and visible" — strong but long. Review line breaks on mobile
- [ ] **Subhead** — Too long? "Real-time USDC receipts, ERC-8004 identity resolution, and complete transparency" — consider shortening
- [ ] **CTA buttons** — 3 buttons: "View Receipts", "Star on GitHub", "Judge Mode". Is 3 too many? Do judges know what "Judge Mode" is without context?
- [ ] **Trust badges** — "Live on Base + Ethereum", "ERC-8004 Verified", "x402 Payments" — useful but generic-feeling. Make more specific?
- [ ] **Overall spacing** — 12 units margin-bottom feels huge on mobile

### AgentHeader Component
- [ ] **What does it show?** Review receipt count + source display. Is source info useful to end users?
- [ ] **Is this redundant?** If stats card exists below, does this add value?

### Chain Selector
- [ ] **"Base (8453)" / "Ethereum (1)"** — Chain IDs are dev info. Should just say "Base" and "Ethereum"
- [ ] **Default chain** — Base first makes sense. But if Ethereum has no data, should we still show it?
- [ ] **Button style** — Small inline buttons. Are they discoverable enough?

### Wallet Selector
- [ ] **"Both Wallets" button** — Makes sense. But showing raw wallet addresses in buttons is ugly
- [ ] **"Clawlinker (0x5793...3af8)"** — Can we show just the name + an icon?
- [ ] **"Bankr (0x4de9...e292)"** — Same. Names should be enough
- [ ] **Mobile overflow** — These buttons probably wrap badly on narrow screens

### ReceiptStats Card
- [ ] **What 4 stats?** Review each stat for relevance
- [ ] **Is this pulling real data or sample?** Verify on live site
- [ ] **Positioning** — Above or below filters? Should be above for context

### Filter/Search Card
- [ ] **Search input** — Good, always visible. Keyboard shortcut hint "/" is nice
- [ ] **Accordion toggle** — New feature. Does the chevron animate smoothly?
- [ ] **Direction filter** — "All / Sent / Received" — clear
- [ ] **Amount range** — Min/Max inputs. Useful for our dataset? Our amounts are tiny ($0.00-$10)
- [ ] **Date range** — Two date pickers. Useful or overkill for a demo?
- [ ] **"Clear all filters" link** — Good UX, keep
- [ ] **Active filter indicator** — Green dot on "Filters" text. Subtle enough?

### Receipt Count Bar
- [ ] **"X receipts" / "Showing X of Y receipts"** — Clean, keep
- [ ] **Position** — Between filters and feed. Correct placement

### Receipt Feed (ReceiptCard)
- [ ] **Card layout** — Review each field shown: hash, from, to, amount, timestamp, direction, service
- [ ] **Inference receipts mixed with USDC** — Is this confusing? Should they be visually distinct?
- [ ] **"isFirstInference" divider** — Does this actually render? What does it look like?
- [ ] **Card click behavior** — Do cards link to `/receipt/[hash]`?
- [ ] **Animation** — Were fade-in animations added per Phase 7?
- [ ] **Empty state** — Circular gray div as placeholder icon. Needs a real icon
- [ ] **Loading state** — "Loading receipts..." — needs skeleton cards instead

### Footer
- [ ] **Copy** — "Built by Clawlinker for the Synthesis Hackathon" — fine
- [ ] **x402 badge** — "x402 API available — /api/x402/receipts ($0.01 USDC)" — is this an ad? Useful for developers but weird for judges
- [ ] **Styling** — Minimal. Maybe add links to Build Log, Costs page, GitHub

---

## Build Log (`app/build-log/page.tsx`)
- [ ] **Purpose** — Shows how the app was built autonomously. Great for judges
- [ ] **Git commit list** — Are commits rendering? Is it pulling live data?
- [ ] **Agent log timeline** — Review what's shown, is it clear?
- [ ] **Navigation back** — Can you get back to home?
- [ ] **Mobile layout** — Review

## Costs Page (`app/costs/page.tsx`)
- [ ] **Purpose** — Shows LLM spending transparency. Key for Bankr bounty
- [ ] **Data source** — Pulling from agent_log.json compute_budget
- [ ] **Breakdown quality** — By model? By phase? By cron?
- [ ] **Totals accuracy** — Cross-check with actual Bankr credits
- [ ] **Navigation** — Header/breadcrumb?

## Judge Mode (`app/judge/page.tsx`)
- [ ] **Purpose** — Self-referential demo for agentic judges
- [ ] **What's shown?** — agent_log.json feed, cost dashboard, build timeline
- [ ] **Is it overwhelming?** — Judges have limited time. Prioritize signal
- [ ] **Loading state** — What happens before data loads?

## Receipt Detail (`app/receipt/[hash]/page.tsx`)
- [ ] **Purpose** — Shareable single-receipt view with OG tags
- [ ] **Layout** — Full receipt info + verification status
- [ ] **OG image** — Does it generate? Check /api/og/[txhash]
- [ ] **SVG receipt** — Does the visual receipt render?
- [ ] **Share button** — Can you copy URL?

---

## Components

### ReceiptCard.tsx (167 lines)
- [ ] All fields justified?
- [ ] Direction indicator (sent/received) clear?
- [ ] Amount formatting correct ($0.01 not 0.010000)?
- [ ] Timestamp human-readable?
- [ ] Service labels rendering?
- [ ] Agent identity badges showing?

### InferenceModal.tsx (158 lines)
- [ ] What triggers it?
- [ ] What does it show? Model breakdown?
- [ ] Close behavior?
- [ ] Mobile overflow?

### ReceiptStats.tsx (65 lines)
- [ ] What 4 stats exactly?
- [ ] Are they accurate?
- [ ] Responsive grid?

### AgentHeader.tsx (68 lines)
- [ ] What info is shown?
- [ ] Is it redundant with other elements?
- [ ] Avatar/identity rendering?

---

## Cross-cutting

- [ ] **Navigation** — No nav bar? How do users get between pages?
- [ ] **Loading states** — Skeletons everywhere, not "Loading..."
- [ ] **Error states** — What happens when API fails? (It's failing right now)
- [ ] **Mobile responsiveness** — Every page
- [ ] **Dark mode** — Is it dark-only or adaptive?
- [ ] **Typography** — Consistent hierarchy?
- [ ] **Color scheme** — USDC green consistent? Contrast passing?
- [ ] **Performance** — Any unnecessary re-renders? Heavy components?

---

_This is the review checklist for the autonomous pipeline. Each [ ] becomes a task._
