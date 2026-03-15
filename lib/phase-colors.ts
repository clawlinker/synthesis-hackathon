/** Shared phase colour tokens used across costs, build-log and judge pages. */
export const phaseColors: Record<string, string> = {
  discover: 'bg-blue-500/15 text-blue-400',
  plan: 'bg-purple-500/15 text-purple-400',
  execute: 'bg-emerald-500/15 text-emerald-400',
  verify: 'bg-amber-500/15 text-amber-400',
  cron: 'bg-cyan-500/15 text-cyan-400',
}

/** Same palette with border tokens (used in build-log timeline). */
export const phaseColorsWithBorder: Record<string, string> = {
  discover: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  plan: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  execute: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  verify: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  cron: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
}
