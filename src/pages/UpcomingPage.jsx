import { useState, useEffect } from 'react'
import { getVehicles, getVehicleRecords } from '../utils/api'
import { getUpcomingMaintenance } from '../utils/maintenanceSchedule'

const STATUS_STYLES = {
  overdue: 'bg-red-50 border-red-200',
  'due-soon': 'bg-orange-50 border-orange-200',
  upcoming: 'bg-yellow-50 border-yellow-200',
  ok: 'bg-white border-gray-200',
}

const STATUS_BADGE = {
  overdue: 'bg-red-100 text-red-700',
  'due-soon': 'bg-orange-100 text-orange-700',
  upcoming: 'bg-yellow-100 text-yellow-700',
  ok: 'bg-green-100 text-green-700',
}

const STATUS_LABEL = {
  overdue: 'OVERDUE',
  'due-soon': 'DUE SOON',
  upcoming: 'UPCOMING',
  ok: 'OK',
}

export default function UpcomingPage({ refreshKey }) {
  const [allItems, setAllItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getVehicles().then(async (vehicles) => {
      const items = []
      await Promise.all(vehicles.map(async (vehicle) => {
        const records = await getVehicleRecords(vehicle.id)
        getUpcomingMaintenance(vehicle, records)
          .filter(item => item.status !== 'ok')
          .forEach(item => items.push({ ...item, vehicle }))
      }))
      if (!cancelled) {
        items.sort((a, b) => a.milesUntilDue - b.milesUntilDue)
        setAllItems(items)
        setLoading(false)
      }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [refreshKey])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="text-center">
          <p className="text-3xl mb-2">🔄</p>
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (allItems.length === 0) {
    return (
      <div className="p-4 text-center py-16 text-gray-400">
        <p className="text-4xl mb-2">✅</p>
        <p className="font-medium">All vehicles are up to date!</p>
        <p className="text-sm mt-1">No upcoming maintenance in the next 2,000 miles.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Upcoming Maintenance</h2>
      <p className="text-sm text-gray-500">Showing overdue and due within 2,000 miles across all vehicles</p>

      {allItems.map((item, idx) => (
        <div key={idx} className={`border rounded-xl p-4 ${STATUS_STYLES[item.status]}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[item.status]}`}>
                  {STATUS_LABEL[item.status]}
                </span>
                <span className="text-xs text-gray-500">
                  {item.vehicle.year} {item.vehicle.model}
                </span>
              </div>
              <p className="font-medium text-gray-800 mt-1">{item.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {item.status === 'overdue'
                  ? `${Math.abs(item.milesUntilDue).toLocaleString()} miles overdue`
                  : `Due in ${item.milesUntilDue.toLocaleString()} miles`}
                {item.lastDate && ` · Last: ${item.lastDate}`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-gray-800">${item.estimatedCost.toLocaleString()}</p>
              <p className="text-xs text-gray-400">est. cost</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
