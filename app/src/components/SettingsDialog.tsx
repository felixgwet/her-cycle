import { useEffect, useState } from 'react'
import { type CycleSettings, toISO, today } from '@/lib/cycle'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  settings: CycleSettings
  onSave: (s: CycleSettings) => void
}

export default function SettingsDialog({ open, onOpenChange, settings, onSave }: Props) {
  const [start, setStart] = useState(settings.periodStart)
  const [plen, setPlen] = useState(String(settings.periodLength))
  const [clen, setClen] = useState(String(settings.cycleLength))

  useEffect(() => {
    if (open) {
      setStart(settings.periodStart)
      setPlen(String(settings.periodLength))
      setClen(String(settings.cycleLength))
    }
  }, [open, settings])

  const save = () => {
    onSave({
      periodStart: start || settings.periodStart,
      periodLength: Math.max(1, parseInt(plen) || settings.periodLength),
      cycleLength: Math.max(5, parseInt(clen) || settings.cycleLength),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-rose-950">Cycle settings</DialogTitle>
          <DialogDescription>
            Update the dates whenever a new period starts and every prediction recalculates instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="pstart">First day of her latest / next period</Label>
            <Input id="pstart" type="date" value={start} onChange={e => setStart(e.target.value)} />
            <p className="text-[11px] text-rose-950/50">
              Currently set to {start}. Next period is predicted {predictNext(start, parseInt(clen) || 28)}.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plen">Period length (days)</Label>
              <Input id="plen" type="number" min={1} max={10} value={plen} onChange={e => setPlen(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clen">Full cycle length (days)</Label>
              <Input id="clen" type="number" min={10} max={90} value={clen} onChange={e => setClen(e.target.value)} />
            </div>
          </div>

          <Separator />

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setStart(toISO(today()))}
          >
            🩸 Period started today — set day 1 to now
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-rose-700 hover:bg-rose-800 text-white" onClick={save}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function predictNext(start: string, clen: number): string {
  try {
    const [y, m, d] = start.split('-').map(Number)
    const dt = new Date(y, m - 1, d + clen)
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}
