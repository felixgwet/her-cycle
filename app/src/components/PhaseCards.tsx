import { addDays, type CycleSettings, cycleStages, fmt, ovulationDay, parseISO, type Stage } from '@/lib/cycle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, HeartPulse, Sparkles } from 'lucide-react'

const COPY: Record<Stage, { icon: React.ReactNode; name: string; fertility: string; intense: string; emotion: string; color: string; soft: string }> = {
  menstrual: {
    icon: <HeartPulse className="h-4 w-4" />,
    name: 'Menstrual · period',
    fertility: 'Very low — among the safest days of the cycle',
    intense: 'Most physically intense: days 1–2 (cramps, fatigue)',
    emotion: 'Tenderest emotionally — she may want comfort, quiet and care. Small gestures land big.',
    color: '#e11d48', soft: 'rgba(225,29,72,0.10)',
  },
  follicular: {
    icon: <Sparkles className="h-4 w-4" />,
    name: 'Follicular · recharge',
    fertility: 'Low, slowly rising',
    intense: 'Energy climbs each day — a good window for plans & workouts',
    emotion: 'Mood lifts steadily; she gets more social, playful and motivated.',
    color: '#f59e0b', soft: 'rgba(245,158,11,0.10)',
  },
  fertile: {
    icon: <Flame className="h-4 w-4" />,
    name: 'Fertile window → ovulation',
    fertility: 'High → peak on ovulation day — the most fertile days of the cycle',
    intense: 'Most energetic & magnetic: the day before ovulation and ovulation day itself',
    emotion: 'Often the most confident, affectionate and upbeat stretch of the whole cycle.',
    color: '#059669', soft: 'rgba(5,150,105,0.10)',
  },
  luteal: {
    icon: <HeartPulse className="h-4 w-4" />,
    name: 'Luteal · wind-down',
    fertility: 'Drops fast after ovulation — very low again in the final days',
    intense: 'Most emotionally intense: the last 2 days before the next period (PMS peak)',
    emotion: 'Energy tapers and patience can run shorter — be extra gentle, avoid scheduling friction.',
    color: '#8b5cf6', soft: 'rgba(139,92,246,0.10)',
  },
}

export default function PhaseCards({ settings }: { settings: CycleSettings }) {
  const start = parseISO(settings.periodStart)
  const stages = cycleStages(settings)
  const ovu = ovulationDay(settings)

  return (
    <Card className="border-0 shadow-xl shadow-rose-900/5 bg-white/80 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-xl text-rose-950">The stages, decoded</CardTitle>
        <p className="text-sm text-rose-900/55 font-normal">
          Fertility from lowest → highest, plus where each stage tends to peak in intensity and emotion.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {stages.map(r => {
          const c = COPY[r.stage]
          const from = addDays(start, r.from - 1)
          const to = addDays(start, r.to - 1)
          const ovuNote = r.stage === 'fertile' && r.from <= ovu && ovu <= r.to
            ? ` · ovulation on day ${ovu} (${fmt(addDays(start, ovu - 1), { month: 'short', day: 'numeric' })})`
            : ''
          return (
            <div key={r.stage} className="rounded-2xl p-4 border border-rose-100/70" style={{ background: c.soft }}>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-white/80" style={{ color: c.color }}>{c.icon}</span>
                <span className="font-semibold text-sm text-rose-950">{c.name}</span>
              </div>
              <div className="mt-2 text-[11px] font-medium text-rose-950/50">
                Day {r.from}–{r.to} · {fmt(from)} – {fmt(to)}{ovuNote}
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-rose-950/70 leading-relaxed">
                <li><span className="font-semibold" style={{ color: c.color }}>Fertility:</span> {c.fertility}</li>
                <li><span className="font-semibold" style={{ color: c.color }}>Intensity:</span> {c.intense}</li>
                <li><span className="font-semibold" style={{ color: c.color }}>Emotionally:</span> {c.emotion}</li>
              </ul>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
