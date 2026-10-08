import { useMemo, useState } from 'react'
import {
  buildAlerts, type CycleSettings, energyLabel, fertilityLabel, fmt, getDayInfo,
  loadSettings, ovulationDay, saveSettings, today,
} from '@/lib/cycle'
import CycleWheel from '@/components/CycleWheel'
import MonthCalendar from '@/components/MonthCalendar'
import AlertsPanel from '@/components/AlertsPanel'
import PhaseCards from '@/components/PhaseCards'
import SettingsDialog from '@/components/SettingsDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarHeart, Settings2 } from 'lucide-react'

export default function Home() {
  const [settings, setSettings] = useState<CycleSettings>(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const t = today()
  const info = useMemo(() => getDayInfo(t, settings), [settings])
  const alerts = useMemo(() => buildAlerts(settings), [settings])
  const ovu = ovulationDay(settings)

  const update = (s: CycleSettings) => {
    setSettings(s)
    saveSettings(s)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* soft background blooms */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full bg-rose-200/50 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -right-48 w-[520px] h-[520px] rounded-full bg-violet-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-[420px] h-[420px] rounded-full bg-amber-100/60 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* header */}
        <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm tracking-wide">
              <CalendarHeart className="h-4 w-4" />
              {fmt(t, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-rose-950 mt-1">
              LunaFlow <span className="text-rose-400">·</span> a caring cycle tracker
            </h1>
            <p className="text-rose-900/55 mt-2 max-w-xl text-sm sm:text-base">
              Every phase, every heads-up — so you always know when to bring chocolate, patience, or plans.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-rose-200 text-rose-800 hover:bg-rose-50 bg-white/70 backdrop-blur"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="h-4 w-4 mr-2" /> Edit cycle dates
          </Button>
        </header>

        {/* today + wheel + alerts */}
        <div className="grid gap-5 lg:grid-cols-3 mb-5">
          {/* hero card */}
          <Card className="border-0 shadow-xl shadow-rose-900/5 bg-gradient-to-br from-rose-500 to-rose-700 text-white overflow-hidden">
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div>
                <div className="text-rose-100 text-xs font-semibold uppercase tracking-[0.18em]">Where she is today</div>
                <div className="font-display text-3xl font-semibold mt-2 leading-tight">
                  {info.phase === 'menstrual'
                    ? 'On her period'
                    : info.phase === 'ovulation'
                      ? 'Ovulation day'
                      : info.phase === 'fertile'
                        ? 'Fertile window'
                        : info.phase === 'follicular'
                          ? 'Recharging'
                          : 'Winding down'}
                </div>
                <p className="text-rose-100/90 text-sm mt-2 leading-relaxed">{info.mood}.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="rounded-xl bg-white/15 backdrop-blur p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-100">Fertility</div>
                  <div className="font-display text-lg font-semibold mt-0.5">{fertilityLabel(info.fertility)}</div>
                </div>
                <div className="rounded-xl bg-white/15 backdrop-blur p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-100">Energy</div>
                  <div className="font-display text-lg font-semibold mt-0.5">{energyLabel(info.energy)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* wheel */}
          <Card className="border-0 shadow-xl shadow-rose-900/5 bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <CycleWheel info={info} cycleLength={settings.cycleLength} periodLength={settings.periodLength} ovu={ovu} />
              <p className="text-center text-[11px] text-rose-900/45 -mt-2">
                One full {settings.cycleLength}-day cycle · needle marks today (day {info.cycleDay})
              </p>
            </CardContent>
          </Card>

          {/* alerts */}
          <AlertsPanel alerts={alerts} />
        </div>

        {/* calendar + stages */}
        <div className="grid gap-5 lg:grid-cols-5 mb-5">
          <div className="lg:col-span-3">
            <MonthCalendar settings={settings} />
          </div>
          <div className="lg:col-span-2">
            <PhaseCards settings={settings} />
          </div>
        </div>

        <footer className="text-center text-xs text-rose-900/40 pb-4">
          Predictions are estimates based on cycle math — every body is different. Not medical advice;
          update the dates in settings whenever a real period starts to keep forecasts sharp. 💗
        </footer>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} onSave={update} />
    </div>
  )
}
