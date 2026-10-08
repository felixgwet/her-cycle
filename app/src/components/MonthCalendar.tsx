import { useMemo, useState } from 'react'
import {
  addDays, addMonths, type CycleSettings, type DayInfo, fmt, getDayInfo,
  PHASE_META, toISO, today,
} from '@/lib/cycle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  settings: CycleSettings
}

export default function MonthCalendar({ settings }: Props) {
  const t = today()
  const [month, setMonth] = useState(new Date(t.getFullYear(), t.getMonth(), 1))
  const [selected, setSelected] = useState<string>(toISO(t))

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const start = addDays(first, -first.getDay()) // Sunday-start grid
    return Array.from({ length: 42 }, (_, i) => getDayInfo(addDays(start, i), settings))
  }, [month, settings])

  const isToday = (d: DayInfo) => d.iso === toISO(t)
  const isSel = (d: DayInfo) => d.iso === selected

  return (
    <Card className="border-0 shadow-xl shadow-rose-900/5 bg-white/80 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-xl text-rose-950">
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(addMonths(month, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth(addMonths(month, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
          {(Object.keys(PHASE_META) as (keyof typeof PHASE_META)[]).map(p => (
            <span key={p} className="flex items-center gap-1.5 text-[11px] font-medium text-rose-950/60">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PHASE_META[p].color }} />
              {PHASE_META[p].label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-rose-950/60">
            <span className="text-[10px]">⚡</span> Physical peak <span className="text-[10px] ml-1">💜</span> Emotional peak
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-rose-900/40 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(d => {
            const meta = PHASE_META[d.phase]
            const inMonth = d.date.getMonth() === month.getMonth()
            return (
              <Popover key={d.iso}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => setSelected(d.iso)}
                    className={`
                      relative aspect-square rounded-lg text-sm flex flex-col items-center justify-center
                      transition-all hover:scale-105 hover:shadow-md
                      ${isSel(d) ? 'ring-2 ring-rose-950 ring-offset-1' : ''}
                      ${!inMonth ? 'opacity-30' : ''}
                    `}
                    style={{ background: meta.soft, color: meta.text }}
                  >
                    <span className={`${d.phase === 'menstrual' ? 'font-bold' : 'font-medium'}`}>{d.date.getDate()}</span>
                    <span className="flex gap-0.5 h-2.5 items-center">
                      {d.physicalPeak && <span className="text-[8px] leading-none">⚡</span>}
                      {d.emotionalPeak && <span className="text-[8px] leading-none">💜</span>}
                      {d.phase === 'ovulation' && <span className="text-[8px] leading-none">✨</span>}
                    </span>
                    {isToday(d) && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-950 border-2 border-white" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
                  <DayDetail info={d} />
                </PopoverContent>
              </Popover>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function DayDetail({ info }: { info: DayInfo }) {
  const meta = PHASE_META[info.phase]
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-display font-semibold text-rose-950">{fmt(info.date, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: meta.soft, color: meta.text }}>
          {meta.label}
        </span>
      </div>
      <div className="text-xs text-rose-950/55 mt-0.5">Cycle day {info.cycleDay}</div>
      <div className="mt-2 space-y-1.5 text-xs">
        <Row label="Fertility" value={`${'●'.repeat(info.fertility)}${'○'.repeat(5 - info.fertility)}`} tone={meta.color} />
        <Row label="Energy" value={`${'●'.repeat(info.energy)}${'○'.repeat(5 - info.energy)}`} tone="#f59e0b" />
        <p className="text-rose-950/65 leading-relaxed pt-1">{info.mood}</p>
        {info.flags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {info.flags.map(f => (
              <span key={f} className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-semibold">{f}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-rose-950/50 font-medium">{label}</span>
      <span style={{ color: tone }} className="tracking-tight text-[11px]">{value}</span>
    </div>
  )
}
