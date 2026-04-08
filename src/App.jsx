import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import VehicleDetail from './pages/VehicleDetail'
import AddRecord from './pages/AddRecord'
import AddVehicle from './pages/AddVehicle'
import UpcomingPage from './pages/UpcomingPage'
import SettingsModal from './components/SettingsModal'

export default function App() {
  const [tab, setTab] = useState('vehicles')
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  const [addingRecord, setAddingRecord] = useState(false)
  const [addingVehicle, setAddingVehicle] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [refresh, setRefresh] = useState(0)

  const triggerRefresh = () => setRefresh(r => r + 1)

  if (addingVehicle) {
    return (
      <AddVehicle
        onSave={() => { setAddingVehicle(false); triggerRefresh() }}
        onCancel={() => setAddingVehicle(false)}
      />
    )
  }

  if (addingRecord) {
    return (
      <>
        <AddRecord
          vehicleId={selectedVehicleId}
          onSave={() => { setAddingRecord(false); triggerRefresh() }}
          onCancel={() => setAddingRecord(false)}
          onOpenSettings={() => setShowSettings(true)}
        />
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </>
    )
  }

  if (selectedVehicleId && tab === 'vehicles') {
    return (
      <>
        <VehicleDetail
          vehicleId={selectedVehicleId}
          onBack={() => setSelectedVehicleId(null)}
          onAddRecord={() => setAddingRecord(true)}
          refresh={refresh}
          onRefresh={triggerRefresh}
        />
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-red-600 text-white px-4 py-3 shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">MyCars</h1>
          <p className="text-red-200 text-xs">Vehicle Maintenance Tracker</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="text-red-200 hover:text-white text-sm px-2 py-1 rounded-lg"
          title="Settings"
        >
          ⚙️
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {tab === 'vehicles' && (
          <Dashboard
            refreshKey={refresh}
            onSelectVehicle={(id) => { setSelectedVehicleId(id) }}
            onAddVehicle={() => setAddingVehicle(true)}
          />
        )}
        {tab === 'upcoming' && <UpcomingPage refreshKey={refresh} />}
        {tab === 'add' && (
          <AddRecord
            vehicleId={null}
            onSave={() => { setTab('vehicles'); triggerRefresh() }}
            onCancel={() => setTab('vehicles')}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-200 flex">
        {[
          { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
          { id: 'upcoming', label: 'Upcoming', icon: '🔔' },
          { id: 'add', label: 'Add Record', icon: '➕' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSelectedVehicleId(null) }}
            className={`flex-1 py-2 flex flex-col items-center text-xs font-medium transition-colors ${
              tab === t.id ? 'text-red-600 border-t-2 border-red-600' : 'text-gray-500'
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

    </div>
  )
}
