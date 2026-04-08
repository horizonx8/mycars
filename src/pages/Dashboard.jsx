import { useState, useEffect } from 'react'
import { getVehicles, getVehicleRecords } from '../utils/api'
import { getUpcomingMaintenance } from '../utils/maintenanceSchedule'
import VehicleCard from '../components/VehicleCard'

export default function Dashboard({ onSelectVehicle, onAddVehicle, refreshKey }) {
  const [vehicles, setVehicles] = useState([])
  const [recordsByVehicle, setRecordsByVehicle] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getVehicles().then(async (vs) => {
      if (cancelled) return
      setVehicles(vs)
      const map = {}
      await Promise.all(vs.map(async v => {
        const recs = await getVehicleRecords(v.id)
        map[v.id] = recs
      }))
      if (!cancelled) { setRecordsByVehicle(map); setLoading(false) }
    }).catch(() => {
      if (cancelled) return
      // Retry once after 1s in case backend wasn't ready
      setTimeout(() => {
        if (cancelled) return
        getVehicles().then(async (vs) => {
          if (cancelled) return
          setVehicles(vs)
          const map = {}
          await Promise.all(vs.map(async v => {
            const recs = await getVehicleRecords(v.id)
            map[v.id] = recs
          }))
          if (!cancelled) { setRecordsByVehicle(map); setLoading(false) }
        }).catch(() => { if (!cancelled) setLoading(false) })
      }, 1000)
    })
    return () => { cancelled = true }
  }, [refreshKey])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <div className="text-center">
        <p className="text-3xl mb-2">🔄</p>
        <p className="text-sm">Loading vehicles...</p>
      </div>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">My Vehicles</h2>
        <button
          onClick={onAddVehicle}
          className="bg-red-600 text-white text-sm px-3 py-1.5 rounded-lg font-medium"
        >
          + Add Vehicle
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🚗</p>
          <p>No vehicles yet. Add your first vehicle!</p>
        </div>
      ) : (
        vehicles.map(vehicle => {
          const records = recordsByVehicle[vehicle.id] || []
          const upcoming = getUpcomingMaintenance(vehicle, records)
          const overdueCount = upcoming.filter(u => u.status === 'overdue').length
          const dueSoonCount = upcoming.filter(u => u.status === 'due-soon').length
          const lastRecord = records[0]
          return (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              lastRecord={lastRecord}
              overdueCount={overdueCount}
              dueSoonCount={dueSoonCount}
              onClick={() => onSelectVehicle(vehicle.id)}
            />
          )
        })
      )}
    </div>
  )
}
