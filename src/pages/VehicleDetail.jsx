import { useState, useEffect } from 'react'
import { getVehicles, getVehicleRecords, deleteVehicle, updateVehicle, deleteRecord, createRecord } from '../utils/api'
import { getUpcomingMaintenance } from '../utils/maintenanceSchedule'
import ServiceTimeline from '../components/ServiceTimeline'
import UpcomingReminders from '../components/UpcomingReminders'
import CostEstimator from '../components/CostEstimator'
import EditVehicleForm from '../components/EditVehicleForm'
import EditRecord from './EditRecord'

export default function VehicleDetail({ vehicleId, onBack, onAddRecord, refresh, onRefresh }) {
  const [activeTab, setActiveTab] = useState('history')
  const [editing, setEditing] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [vehicle, setVehicle] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getVehicles(),
      getVehicleRecords(vehicleId),
    ]).then(([vehicles, recs]) => {
      if (cancelled) return
      const v = vehicles.find(v => v.id === vehicleId)
      if (!v) { onBack(); return }
      setVehicle(v)
      setRecords(recs)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [vehicleId, refresh])

  const handleMarkDone = async (item, date) => {
    await createRecord({
      vehicleId,
      date,
      mileage: vehicle.currentMileage,
      shop: 'Self / Unknown',
      invoiceNumber: '',
      totalCost: 0,
      services: [{ description: item.name, category: item.category, cost: 0 }],
      notes: 'Marked complete from upcoming maintenance reminder',
      source: 'manual',
      photoIds: [],
    })
    onRefresh()
  }

  const handleDeleteRecord = async (id) => {
    await deleteRecord(id)
    onRefresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-gray-400">
          <p className="text-3xl mb-2">🔄</p>
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!vehicle) return null

  const upcoming = getUpcomingMaintenance(vehicle, records)

  if (editing) {
    return (
      <EditVehicleForm
        vehicle={vehicle}
        onSave={async (updated) => {
          await updateVehicle(updated)
          setEditing(false)
          onRefresh()
        }}
        onCancel={() => setEditing(false)}
        onDelete={async () => {
          await deleteVehicle(vehicleId)
          onBack()
        }}
      />
    )
  }

  if (editingRecord) {
    return (
      <EditRecord
        record={editingRecord}
        onSave={() => { setEditingRecord(null); onRefresh() }}
        onCancel={() => setEditingRecord(null)}
      />
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-lg mx-auto">
      <header className="bg-red-600 text-white px-4 py-3 shadow-md flex items-center gap-3">
        <button onClick={onBack} className="text-red-200 hover:text-white text-xl">←</button>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight">
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
          </h1>
          <p className="text-red-200 text-xs">{vehicle.currentMileage.toLocaleString()} miles</p>
        </div>
        <button onClick={() => setEditing(true)} className="text-red-200 hover:text-white text-sm px-2">✏️</button>
      </header>

      <div className="flex border-b border-gray-200 bg-white">
        {[
          { id: 'history', label: 'History' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'cost', label: 'Cost Est.' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t.id
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'history' && (
        <div className="px-4 py-2 bg-white border-b border-gray-100">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search history... (transmission, oil, brake...)"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-2 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">×</button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'history' && (
          <ServiceTimeline
            records={records}
            onAddRecord={onAddRecord}
            onDeleteRecord={handleDeleteRecord}
            onEditRecord={(record) => setEditingRecord(record)}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === 'upcoming' && (
          <UpcomingReminders upcoming={upcoming} vehicle={vehicle} onMarkDone={handleMarkDone} />
        )}
        {activeTab === 'cost' && (
          <CostEstimator vehicle={vehicle} upcoming={upcoming} />
        )}
      </div>
    </div>
  )
}
