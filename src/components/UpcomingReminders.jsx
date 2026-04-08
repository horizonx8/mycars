import { useState } from 'react'

const STATUS_CONFIG = {
  overdue: { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', label: 'OVERDUE', icon: '🔴' },
  'due-soon': { bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', label: 'DUE SOON', icon: '🟠' },
  upcoming: { bg: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', label: 'UPCOMING', icon: '🟡' },
  ok: { bg: 'bg-white border-gray-100', badge: 'bg-green-100 text-green-700', label: 'OK', icon: '🟢' },
}

export default function UpcomingReminders({ upcoming, vehicle, onMarkDone }) {
  const [markingDone, setMarkingDone] = useState(null)
  const [doneDate, setDoneDate] = useState(new Date().toISOString().split('T')[0])

  const overdue = upcoming.filter(u => u.status === 'overdue')
  const dueSoon = upcoming.filter(u => u.status === 'due-soon')
  const upcomingItems = upcoming.filter(u => u.status === 'upcoming')
  const ok = upcoming.filter(u => u.status === 'ok')

  const Section = ({ items, title }) => items.length === 0 ? null : (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-4 mb-2">{title}</h3>
      <div className="px-4 space-y-2">
        {items.map((item, idx) => {
          const cfg = STATUS_CONFIG[item.status]
          const isOk = item.status === 'ok'
          return (
            <div key={idx} className={`border rounded-xl p-3 ${cfg.bg}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{cfg.icon}</span>
                    <span className="font-medium text-sm text-gray-800">{item.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.status === 'overdue'
                      ? `${Math.abs(item.milesUntilDue).toLocaleString()} mi overdue · Due at ${item.dueMileage.toLocaleString()} mi`
                      : item.status === 'ok'
                      ? `Next at ${item.dueMileage.toLocaleString()} mi`
                      : `In ${item.milesUntilDue.toLocaleString()} miles · Due at ${item.dueMileage.toLocaleString()} mi`
                    }
                    {item.lastDate && ` · Last: ${item.lastDate}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className="font-semibold text-sm text-gray-800">${item.estimatedCost.toLocaleString()}</p>
                  {item.v6Only && <p className="text-xs text-gray-400">V6</p>}
                  {!isOk && onMarkDone && (
                    <button
                      onClick={() => { setMarkingDone(item.id); setDoneDate(new Date().toISOString().split('T')[0]) }}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-medium shrink-0">
                      ✓ Done
                    </button>
                  )}
                </div>
              </div>
              {markingDone === item.id && (
                <div className="mt-2 flex gap-2 items-center">
                  <input type="date" value={doneDate} onChange={e => setDoneDate(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                  <button onClick={() => { onMarkDone(item, doneDate); setMarkingDone(null) }}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium">Confirm</button>
                  <button onClick={() => setMarkingDone(null)}
                    className="text-gray-500 text-xs px-2 py-1.5 border border-gray-300 rounded-lg">Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="py-4">
      <div className="px-4 mb-4">
        <p className="text-sm text-gray-500">
          Based on {vehicle.currentMileage.toLocaleString()} mi current · Honda factory schedule
        </p>
        {vehicle.engine === 'V6' && (
          <p className="text-xs text-purple-600 mt-1">V6 engine — timing belt interval applies</p>
        )}
      </div>
      <Section items={overdue} title="Overdue" />
      <Section items={dueSoon} title="Due Soon" />
      <Section items={upcomingItems} title="Upcoming (within 2,000 mi)" />
      <Section items={ok} title="On Track" />
    </div>
  )
}
