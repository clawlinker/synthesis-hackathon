# Prompt Optimization: synth-daily-summary

## v1 (Current)
- Concreteness: 7 (21)
- No-narration: 7 (14)
- Brevity: 8 (16)
- Actionability: 8 (16)
- Format: 8 (8)
**Total: 75**

## v2 (Optimized)
```
Output exactly 15 lines. Banned: "I'll", "Let me", "I'm going to", "I will", "You are". Absolute paths only.

1. Stats: Read /root/synthesis-hackathon/agent_log.json and /root/synthesis-hackathon/AUTONOMOUS-LOOP.md. Count today's entries and completed tasks.
2. Context: Read /root/synthesis-hackathon/DECISIONS.md for blockers/decisions.
3. Commits: cd /root/synthesis-hackathon && git log --oneline --since="24 hours ago".

Output format:
📊 Day X Summary (Mar DD)
- Tasks: N/M
- Finds: [bullets]
- Decisions: [bullets]
- Blockers: [bullets]
- Tomorrow: [1 sentence]
- Spend: $X.XX

No other text.
```
- Concreteness: 10 (30)
- No-narration: 10 (20)
- Brevity: 10 (20)
- Actionability: 10 (20)
- Format: 10 (10)
**Total: 100**
