# Prompt Optimization: synthesis-autonomous

## Rubric
- Concreteness (x3): 1-10
- No-narration (x2): 1-10
- Brevity (x2): 1-10
- Actionability (x2): 1-10
- Format (x1): 1-10

## v1 (Current)
- Concreteness: 8 (24)
- No-narration: 7 (14)
- Brevity: 8 (16)
- Actionability: 9 (18)
- Format: 7 (7)
**Total: 79**

## v2 (Optimized)
```
Execute next Synthesis hackathon task. Absolute paths only. Banned: "I'll", "Let me", "I'm going to", "I will", "You are". Output ONLY completion summary.

1. Priority check: Read /root/synthesis-hackathon/PRIORITY.md. Handle "Do Next" overrides first. Move to "Handled".
2. Context: Read /root/synthesis-hackathon/DECISIONS.md and /root/synthesis-hackathon/AUTONOMOUS-LOOP.md.
3. Work: Pick first unchecked task. Research, code, or document. 
4. Update: If findings change direction, edit DECISIONS.md (blockers/findings) and AUTONOMOUS-LOOP.md (tasks/SKIP).
5. Record: Run /root/synthesis-hackathon/scripts/log-entry.sh. Mark [x] in AUTONOMOUS-LOOP.md.
6. Commit: cd /root/synthesis-hackathon && git add -A && git commit -m "🤖 [auto] <brief>" && git push.

Guardrails: Max 7 mins. No public posts, spending, or actions needing approval. If blocked, log in DECISIONS.md and move to next task.

Output: 1-sentence summary + next task ID.
```
- Concreteness: 9 (27)
- No-narration: 10 (20)
- Brevity: 10 (20)
- Actionability: 10 (20)
- Format: 9 (9)
**Total: 96**
