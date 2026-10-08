import { type DayInfo, type Phase, PHASE_META } from '@/lib/cycle'

interface Props {
  info: DayInfo
  cycleLength: number
  periodLength: number
  ovu: number
}

/** SVG donut of the full cycle with phase arcs and a needle marking today. */
export default function CycleWheel({ info, cycleLength, periodLength, ovu }: Props) {
  const size = 300
  const cx = size / 2
  const cy = size / 2
  const r = 118
  const stroke = 26
  const gap = 0.045 // radians between segments

  // phase → [startDay, endDay] (1-based, inclusive)
  const segments: { phase: Phase; from: number; to: number }[] = ([
    { phase: 'menstrual', from: 1, to: periodLength },
    { phase: 'follicular', from: periodLength + 1, to: ovu - 5 - 1 },
    { phase: 'fertile', from: Math.max(ovu - 5, periodLength + 1), to: ovu - 1 },
    { phase: 'ovulation', from: ovu, to: ovu },
    { phase: 'fertile', from: ovu + 1, to: ovu + 1 },
    { phase: 'luteal', from: ovu + 2, to: cycleLength },
  ] as { phase: Phase; from: number; to: number }[]).filter(s => s.to >= s.from)

  const dayAngle = (day: number) => ((day - 1) / cycleLength) * Math.PI * 2 - Math.PI / 2

  const arc = (a0: number, a1: number, radius: number) => {
    const x0 = cx + radius * Math.cos(a0)
    const y0 = cy + radius * Math.sin(a0)
    const x1 = cx + radius * Math.cos(a1)
    const y1 = cy + radius * Math.sin(a1)
    const large = a1 - a0 > Math.PI ? 1 : 0
    return `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`
  }

  const needleAngle = dayAngle(info.cycleDay) + Math.PI / cycleLength
  const nx = cx + (r + stroke / 2 + 8) * Math.cos(needleAngle)
  const ny = cy + (r + stroke / 2 + 8) * Math.sin(needleAngle)
  const tx = cx + (r - stroke / 2 - 14) * Math.cos(needleAngle)
  const ty = cy + (r - stroke / 2 - 14) * Math.sin(needleAngle)

  const meta = PHASE_META[info.phase]

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-0">
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(120,50,70,0.07)" strokeWidth={stroke} />
        {/* phase arcs */}
        {segments.map((s, i) => {
          const a0 = dayAngle(s.from) + gap
          const a1 = dayAngle(s.to + 1) - gap
          return (
            <path
              key={i}
              d={arc(a0, a1, r)}
              fill="none"
              stroke={PHASE_META[s.phase].color}
              strokeWidth={info.phase === s.phase ? stroke + 5 : stroke}
              strokeLinecap="round"
              opacity={info.phase === s.phase ? 1 : 0.32}
              style={{ transition: 'all .4s ease' }}
            />
          )
        })}
        {/* today needle */}
        <line x1={tx} y1={ty} x2={nx} y2={ny} stroke="#1c1216" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={nx} cy={ny} r={4.5} fill="#1c1216" />
      </svg>
      {/* center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-900/50">Cycle day</div>
        <div className="font-display text-6xl font-semibold leading-none text-rose-950 mt-1">{info.cycleDay}</div>
        <div
          className="mt-2 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: meta.soft, color: meta.text }}
        >
          {meta.label}
        </div>
        <div className="mt-2 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: i < info.fertility ? meta.color : 'rgba(120,50,70,0.15)' }}
            />
          ))}
          <span className="ml-1 text-[11px] font-medium text-rose-900/60">{info.fertility}/5 fertile</span>
        </div>
      </div>
    </div>
  )
}
