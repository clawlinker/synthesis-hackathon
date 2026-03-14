# Prompt Optimization: synth-self-review

## v1 (Current)
- Concreteness: 7 (21)
- No-narration: 7 (14)
- Brevity: 7 (14)
- Actionability: 8 (16)
- Format: 7 (7)
**Total: 72**

## v2 (Optimized)
```
Output <30 words. Banned: "I'll", "Let me", "I'm going to", "I will", "You are". Absolute paths only.

1. Inspect: Read last 6 entries in /root/synthesis-hackathon/agent_log.json, /root/synthesis-hackathon/DECISIONS.md, and new code.
2. Check: cd /root/synthesis-hackathon && git log --oneline -6.
3. Review: Drift? Bugs? Stalling? Unchecked assumptions?
4. Fix: If drift/errors, update DECISIONS.md (corrections) or AUTONOMOUS-LOOP.md (reprioritize). 
5. Questions: Add blocker questions to DECISIONS.md.
6. Commit: cd /root/synthesis-hackathon && git add -A && git commit -m "🔍 [review] <finding>" && git push.

Output only: "Review complete: [findings/clean]".
```
- Concreteness: 9 (27)
- No-narration: 10 (20)
- Brevity: 10 (20)
- Actionability: 10 (20)
- Format: 10 (10)
**Total: 97**
