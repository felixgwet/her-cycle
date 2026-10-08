import { type Alert, ALERT_META, diffDays, fmt, today } from '@/lib/cycle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  const t = today()
  return (
    <Card className="border-0 shadow-xl shadow-rose-900/5 bg-white/80 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-xl text-rose-950 flex items-center gap-2">
          <span>🔔</span> Upcoming alerts
        </CardTitle>
        <p className="text-sm text-rose-900/55 font-normal">
          Heads-ups for ovulation, periods, fertility levels and sensitive days — generated from her cycle.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {alerts.length === 0 && (
            <p className="text-sm text-rose-900/50 py-6 text-center">No alerts in the coming weeks.</p>
          )}
          {alerts.map((a, i) => {
            const meta = ALERT_META[a.kind]
            const d = diffDays(a.date, t)
            const when = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${fmt(a.date, { weekday: 'short' })} · in ${d} days`
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl p-3 border border-transparent hover:border-rose-100 transition-colors"
                style={{ background: meta.bg }}
              >
                <span className="text-lg leading-none mt-0.5">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: meta.color }}>{a.title}</span>
                    <Badge variant="secondary" className="bg-white/70 text-rose-950/70 whitespace-nowrap text-[10px]">
                      {when}
                    </Badge>
                  </div>
                  <p className="text-xs text-rose-950/60 mt-0.5 leading-relaxed">{a.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
