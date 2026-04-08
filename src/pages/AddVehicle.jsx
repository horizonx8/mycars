import { useState } from 'react'
import { createVehicle } from '../utils/api'

export default function AddVehicle({ onSave, onCancel }) {
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    make: 'Honda',
    model: '',
    trim: '',
    color: '',
    vin: '',
    license: '',
    currentMileage: 0,
    engine: '4cyl',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createVehicle({ ...form, year: parseInt(form.year), currentMileage: parseInt(form.currentMileage) })
    onSave()
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-lg mx-auto">
      <header className="bg-red-600 text-white px-4 py-3 flex items-center gap-3">
        <button onClick={onCancel} className="text-red-200 hover:text-white text-xl">←</button>
        <h1 className="font-bold text-lg">Add Vehicle</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input type="number" value={form.year} onChange={e => set('year', e.target.value)}
              min="1980" max="2030" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
            <input type="text" value={form.make} onChange={e => set('make', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input type="text" value={form.model} onChange={e => set('model', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trim</label>
            <input type="text" value={form.trim} onChange={e => set('trim', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input type="text" value={form.color} onChange={e => set('color', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Engine</label>
            <select value={form.engine} onChange={e => set('engine', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="4cyl">4-Cylinder</option>
              <option value="V6">V6</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
          <input type="text" value={form.vin} onChange={e => set('vin', e.target.value)}
            maxLength={17} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
            <input type="text" value={form.license} onChange={e => set('license', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Mileage</label>
            <input type="number" value={form.currentMileage} onChange={e => set('currentMileage', e.target.value)}
              min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-200 p-4">
          <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold">
            Add Vehicle
          </button>
        </div>
      </form>
    </div>
  )
}
