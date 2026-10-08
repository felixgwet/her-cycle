// ─── Cycle math & domain model ───────────────────────────────────────────────

export interface CycleSettings {
  /** First day of her most recent (or next upcoming) period, yyyy-mm-dd */
  periodStart: string
  /** How many days bleeding typically lasts */
  periodLength: number
  /** Full cycle length, first day of period → next first day of period */
  cycleLength: number
}

export type Phase = 'menstrual' | 'follicular' | 'fertile' | 'ovulation' | 'luteal'

export interface DayInfo {
  date: Date
  iso: string
  cycleDay: number // 1-based day of the cycle
  cycleIndex: number // which cycle (0 = the one anchored at periodStart)
  phase: Phase
  fertility: 1 | 2 | 3 | 4 | 5
  energy: 1 | 2 | 3 | 4 | 5
  /** Short emotional read for the day */
  mood: string
  /** True on the most physically demanding days (peak cramps / peak energy) */
  physicalPeak: boolean
  /** True on the most emotionally sensitive days */
  emotionalPeak: boolean
  flags: string[]
}

// ─── Date helpers (all local-time, no DST surprises) ────────────────────────

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

export function diffDays(a: Date, b: Date): number {
  const ms = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() -
    new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return Math.round(ms / 86400000)
}

export function today(): Date {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

export function fmt(d: Date, opts?: Intl.DateTimeFormatOptions): string {
  return d.toLocaleDateString('en-US', opts ?? { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── Core calculations ───────────────────────────────────────────────────────

export function ovulationDay(s: CycleSettings): number {
  // Ovulation ~14 days before the next period (standard luteal-phase estimate),
  // never earlier than two days after bleeding stops
  return Math.max(s.periodLength + 2, s.cycleLength - 14)
}

/** Phase for a 1-based cycle day — single source of truth used everywhere. */
export function phaseForCycleDay(cycleDay: number, s: CycleSettings): Phase {
  const ovu = ovulationDay(s)
  const fertileStart = ovu - 5
  const fertileEnd = ovu + 1
  if (cycleDay <= s.periodLength) return 'menstrual'
  if (cycleDay === ovu) return 'ovulation'
  if (cycleDay >= fertileStart && cycleDay <= fertileEnd) return 'fertile'
  if (cycleDay < fertileStart) return 'follicular'
  return 'luteal'
}

export type Stage = 'menstrual' | 'follicular' | 'fertile' | 'luteal'

export interface StageRange {
  stage: Stage
  from: number
  to: number
}

/** Group the cycle's days into contiguous stage ranges (fertile + ovulation merged). */
export function cycleStages(s: CycleSettings): StageRange[] {
  const ranges: StageRange[] = []
  let cur: StageRange | null = null
  for (let d = 1; d <= s.cycleLength; d++) {
    const ph = phaseForCycleDay(d, s)
    const stage: Stage = ph === 'fertile' || ph === 'ovulation' ? 'fertile' : ph
    if (cur && cur.stage === stage && cur.to === d - 1) {
      cur.to = d
    } else {
      cur = { stage, from: d, to: d }
      ranges.push(cur)
    }
  }
  return ranges
}

export function getDayInfo(date: Date, s: CycleSettings): DayInfo {
  const start = parseISO(s.periodStart)
  const diff = diffDays(date, start)
  const cycleLength = s.cycleLength
  const cycleIndex = Math.floor(diff / cycleLength)
  const cycleDay = ((diff % cycleLength) + cycleLength) % cycleLength + 1

  const ovu = ovulationDay(s)
  const fertileStart = ovu - 5
  const pmsPeakDay = cycleLength - 2 // ~2 days before next period

  const phase = phaseForCycleDay(cycleDay, s)

  // Fertility 1 (lowest) → 5 (highest)
  let fertility: DayInfo['fertility'] = 2
  if (phase === 'menstrual') fertility = 1
  else if (phase === 'follicular') fertility = 2
  else if (phase === 'fertile') fertility = (cycleDay >= ovu - 1 ? 4 : 3)
  else if (phase === 'ovulation') fertility = 5
  else {
    // luteal: declines, lowest right before the next period
    fertility = cycleDay >= cycleLength - 3 ? 1 : 2
  }

  // Energy / physical intensity 1 → 5
  let energy: DayInfo['energy'] = 3
  let physicalPeak = false
  let mood = ''
  if (phase === 'menstrual') {
    energy = cycleDay <= 2 ? 1 : 2
    physicalPeak = cycleDay === 1
    mood = cycleDay <= 2
      ? 'Low battery — cramps possible, extra tenderness helps'
      : 'Recovering gently, comfort-seeking'
  } else if (phase === 'follicular') {
    energy = cycleDay <= s.periodLength + 3 ? 3 : 4
    mood = 'Brightening up — motivation and mood climbing'
  } else if (phase === 'fertile') {
    energy = cycleDay >= ovu - 1 ? 5 : 4
    mood = 'Confident, social, upbeat'
  } else if (phase === 'ovulation') {
    energy = 5
    physicalPeak = true
    mood = 'Peak day — highest energy & charisma of the cycle'
  } else {
    energy = cycleDay <= ovu + 5 ? 3 : 2
    mood = cycleDay >= pmsPeakDay - 1
      ? 'Winding down — patience may run shorter'
      : 'Steady, gradually more inward'
  }

  const emotionalPeak = phase === 'menstrual'
    ? cycleDay <= 2
    : phase === 'luteal' && cycleDay >= pmsPeakDay

  const flags: string[] = []
  if (cycleDay === 1) flags.push('Period starts')
  if (cycleDay === s.periodLength) flags.push('Period ends')
  if (cycleDay === ovu - 1) flags.push('Ovulation likely tomorrow')
  if (cycleDay === ovu) flags.push('Ovulation day')
  if (cycleDay === fertileStart) flags.push('Fertile window opens')
  if (emotionalPeak) flags.push('Emotionally sensitive day')

  return {
    date, iso: toISO(date), cycleDay, cycleIndex, phase, fertility, energy,
    mood, physicalPeak, emotionalPeak, flags,
  }
}

// ─── Phase presentation meta ─────────────────────────────────────────────────

export const PHASE_META: Record<Phase, { label: string; color: string; soft: string; text: string; desc: string }> = {
  menstrual: {
    label: 'Menstrual',
    color: '#e11d48',
    soft: 'rgba(225,29,72,0.12)',
    text: '#be123c',
    desc: 'Period days. Lowest fertility, lowest energy — warmth, patience and snacks go a long way.',
  },
  follicular: {
    label: 'Follicular',
    color: '#f59e0b',
    soft: 'rgba(245,158,11,0.14)',
    text: '#b45309',
    desc: 'Post-period recharge. Energy, mood and motivation climb day by day.',
  },
  fertile: {
    label: 'Fertile window',
    color: '#10b981',
    soft: 'rgba(16,185,129,0.13)',
    text: '#047857',
    desc: 'High fertility — likelihood of conception rises steeply toward ovulation.',
  },
  ovulation: {
    label: 'Ovulation',
    color: '#059669',
    soft: 'rgba(5,150,105,0.16)',
    text: '#065f46',
    desc: 'Peak fertility day — highest chance of conception, usually peak energy and mood too.',
  },
  luteal: {
    label: 'Luteal',
    color: '#8b5cf6',
    soft: 'rgba(139,92,246,0.12)',
    text: '#6d28d9',
    desc: 'Post-ovulation wind-down. Energy tapers; the final days can bring PMS sensitivity.',
  },
}

export function fertilityLabel(n: number): string {
  return ['', 'Very low', 'Low', 'Moderate', 'High', 'Peak'][n]
}

export function energyLabel(n: number): string {
  return ['', 'Drained', 'Low', 'Steady', 'High', 'Peak'][n]
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export interface Alert {
  date: Date
  iso: string
  kind: 'period' | 'ovulation' | 'fertile' | 'calm' | 'emotional'
  title: string
  detail: string
}

const ALERT_META: Record<Alert['kind'], { color: string; bg: string; icon: string }> = {
  period: { color: '#e11d48', bg: 'rgba(225,29,72,0.10)', icon: '🩸' },
  ovulation: { color: '#059669', bg: 'rgba(5,150,105,0.10)', icon: '✨' },
  fertile: { color: '#10b981', bg: 'rgba(16,185,129,0.10)', icon: '🌱' },
  calm: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)', icon: '🛡️' },
  emotional: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)', icon: '💜' },
}

export { ALERT_META }

/** Build a sorted list of upcoming alerts for the next `horizon` days. */
export function buildAlerts(s: CycleSettings, horizon = 45): Alert[] {
  const t = today()
  const ovu = ovulationDay(s)
  const alerts: Alert[] = []
  const seen = new Set<string>()

  const push = (a: Alert) => {
    const key = `${a.iso}|${a.kind}|${a.title}`
    if (seen.has(key)) return
    seen.add(key)
    alerts.push(a)
  }

  let calmRunStart: Date | null = null
  let calmRunEnd: Date | null = null

  const flushCalm = () => {
    if (calmRunStart && calmRunEnd && diffDays(calmRunEnd, calmRunStart) >= 2) {
      push({
        date: calmRunStart, iso: toISO(calmRunStart), kind: 'calm',
        title: `Lowest-fertility stretch · ${diffDays(calmRunEnd, calmRunStart) + 1} days`,
        detail: `Conception is least likely between ${fmt(calmRunStart)} and ${fmt(calmRunEnd)} — the safest window of this cycle.`,
      })
    }
    calmRunStart = calmRunEnd = null
  }

  for (let i = 0; i < horizon; i++) {
    const d = addDays(t, i)
    const info = getDayInfo(d, s)
    const inDays = i === 0 ? 'today' : i === 1 ? 'tomorrow' : `in ${i} days`

    if (info.cycleDay === 1) {
      push({
        date: d, iso: info.iso, kind: 'period',
        title: `Period expected ${inDays}`,
        detail: `Day 1 of the cycle — have comfort supplies ready. Most intense cramps usually land in the first 2 days.`,
      })
    }
    if (info.cycleDay === ovu - 1) {
      push({
        date: d, iso: info.iso, kind: 'ovulation',
        title: `Ovulation likely tomorrow`,
        detail: `Peak fertility is around ${fmt(addDays(d, 1))}. She may feel her absolute best — energy, mood and confidence peak here.`,
      })
    }
    if (info.cycleDay === ovu) {
      push({
        date: d, iso: info.iso, kind: 'ovulation',
        title: `Ovulation day ${inDays}`,
        detail: `Highest chance of conception today. Often the highest-energy, most socially magnetic day of the cycle.`,
      })
    }
    if (info.cycleDay === ovu - 5) {
      push({
        date: d, iso: info.iso, kind: 'fertile',
        title: `Fertile window opens ${inDays}`,
        detail: `High-fertility days run through ${fmt(addDays(d, 6))}, peaking on day ${ovu}.`,
      })
    }
    if (info.emotionalPeak && info.phase === 'luteal') {
      push({
        date: d, iso: info.iso, kind: 'emotional',
        title: `Emotionally sensitive day ${inDays}`,
        detail: `Late-luteal PMS zone — moods can run most intense now. Extra patience and tenderness are gold.`,
      })
    }
    if (info.emotionalPeak && info.phase === 'menstrual' && info.cycleDay === 1) {
      push({
        date: d, iso: info.iso, kind: 'emotional',
        title: `Gentle day ${inDays}`,
        detail: `First period days are usually the most emotionally and physically intense — lead with care.`,
      })
    }

    // Track consecutive very-low-fertility days
    if (info.fertility === 1) {
      if (!calmRunStart) calmRunStart = d
      calmRunEnd = d
    } else {
      flushCalm()
    }
  }
  flushCalm()

  return alerts.sort((a, b) => diffDays(a.date, b.date))
}

// ─── Defaults & persistence ──────────────────────────────────────────────────

export const DEFAULT_SETTINGS: CycleSettings = {
  periodStart: '2026-10-08', // starts tomorrow
  periodLength: 5,
  cycleLength: 19, // next period predicted on the 27th
}

const STORAGE_KEY = 'her-cycle-settings-v1'

export function loadSettings(): CycleSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const p = JSON.parse(raw)
    if (p && typeof p.periodStart === 'string' && p.periodLength > 0 && p.cycleLength > 0) {
      return { periodStart: p.periodStart, periodLength: p.periodLength, cycleLength: p.cycleLength }
    }
  } catch { /* fall through */ }
  return DEFAULT_SETTINGS
}

export function saveSettings(s: CycleSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}
