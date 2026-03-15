# Demo Recording Guide — Agent Receipts

**Purpose:** Create a 3-5 minute walkthrough video for Devfolio submission and agentic judging.

---

## Quick Start (No Setup)

1. Open `/root/synthesis-hackathon/DEMO-SCRIPT.md` and follow the script line-by-line
2. Screen record with OBS, QuickTime, or any screen recorder
3. Upload to YouTube/Vimeo (unlisted)
4. Add video URL to `SUBMISSION.md` under "Demo Video" section

---

## Production Options

### Option A: Automated Recording (Advanced)
```bash
# Coming soon — ffmpeg-based recording script
# Will automate browser navigation and capture
```

### Option B: Manual Recording (Recommended)

**Tools:**
- **OBS Studio** (Linux/Windows) — best for multiple sources
- **QuickTime** (macOS) — simple screen capture
- **VLC** — can capture screen with `Screen Capture` input
- **RecordIt** (browser extension) — quick, no install

**Configuration:**
- Resolution: 1920x1080 minimum
- Frame rate: 30 fps
- Format: MP4/H.264
- Audio: System audio + microphone (separate tracks preferred)

---

## Shot List

| Scene | Content | Duration |
|-------|---------|----------|
| 1 | Terminal: `git clone` + `npm install` | 5s |
| 2 | Browser: `/` main feed | 30s |
| 3 | Browser: Wallet selector → Bankr wallet | 15s |
| 4 | Browser: Click ERC-8004 badge | 10s |
| 5 | Browser: Download SVG receipt | 15s |
| 6 | Browser: Copy receipt URL → open in new tab (OG image) | 10s |
| 7 | DevTools: `/api/receipts` JSON response | 10s |
| 8 | Terminal: `curl` x402 payment endpoint | 10s |
| 9 | Browser: Full feed scroll (show 47+ txs) | 20s |

**Total runtime:** ~2m 35s (edit to 3-4m with voiceover)

---

## Audio Recording

**Script source:** `DEMO-SCRIPT.md`

**Tips:**
- Speak at 140-160 words/minute
- Pause 0.5s between scenes
- Emphasize: "verified", "on-chain", "live", "open source"
- Avoid: jargon like "ERC-8004" without explanation

**Voice options:**
- Record your own voice
- Use ElevenLabs/PlayHT for AI voice (clear, professional)
- **Recommended:** ElevenLabs "Eli" (authoritative, trustworthy)

---

## Editing Checklist

- [ ] Trim silence between scenes
- [ ] Add subtle background music (low volume)
- [ ] Insert text captions for key features
- [ ] Zoom in on agent badge when clicked
- [ ] Add fade transitions (0.3s)
- [ ] Lower audio during screen interactions (so clicks are audible)
- [ ] Export at 1080p, 30fps, MP4/H.264

---

## Upload & Submission

**Video hosting:**
- YouTube (unlisted) — most reliable for judging
- Vimeo — higher quality, smaller audience
- Loom — simple, embedded playback

**Submission steps:**
1. Upload video, set to unlisted
2. Copy share URL
3. Add to `SUBMISSION.md`:
   ```markdown
   ## Demo Video

   [Watch the demo](https://youtube.com/watch?v=...)

   *4-minute walkthrough of Agent Receipts features, live data, and developer API.*
   ```
4. Commit: `git add -A && git commit -m "🎬 [demo] Add walkthrough video" && git push`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Video too long | Cut filler between scenes, trim "uh/um" |
| Audio unclear | Re-record voice, use noise gate |
| Browser lag | Close other tabs, use incognito mode |
| SVG not downloading | Test endpoint first: `curl -o receipt.svg http://localhost:3000/api/receipt/svg/0x...` |
| OG image not showing | Check CORS headers in `/api/og/[txhash]/route.ts` |

---

## Bonus: Agent-Evaluation Optimized

For agentic judges (Mar 18), include these silent UI cues:

- [ ] Show "Agent Identity" badge prominently
- [ ] Display `/api/receipts` JSON in browser (no CLI needed)
- [ ] Show x402 payment UI (even if $0.01 fails)
- [ ] Highlight auto-refresh indicator (30s polling)
- [ ] Show "Live Data" tag on at least one receipt

---

**Next step:** Record using `DEMO-SCRIPT.md`, then update `AUTONOMOUS-LOOP.md` to mark this task [x].
