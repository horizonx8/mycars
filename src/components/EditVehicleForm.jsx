import { useState, useRef } from 'react'
import { uploadImage, getImageUrl, deleteImage } from '../utils/api'
import { compressImage } from '../utils/imageUtils'

export default function EditVehicleForm({ vehicle, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState({ ...vehicle })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [photoId, setPhotoId] = useState(vehicle.photoId || null)
  const vehiclePhotoRef = useRef(null)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = () => {
    onSave({ ...form, photoId })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-lg mx-auto">
      <header className="bg-red-600 text-white px-4 py-3 flex items-center gap-3">
        <button onClick={onCancel} className="text-red-200 hover:text-white text-xl">←</button>
        <h1 className="font-bold text-lg">Edit Vehicle</h1>
      </header>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">

        {/* Vehicle Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Photo</label>
          {photoId && getImageUrl(photoId) ? (
            <div className="relative">
              <img src={getImageUrl(photoId)} alt="Vehicle" className="w-full h-40 object-cover rounded-xl" />
              <div className="absolute top-2 right-2 flex gap-2">
                <button type="button" onClick={() => vehiclePhotoRef.current?.click()}
                  className="bg-white/90 text-gray-700 text-xs px-2 py-1 rounded-lg font-medium">Change</button>
                <button type="button" onClick={() => { deleteImage(photoId).catch(() => {}); setPhotoId(null) }}
                  className="bg-red-500 text-white text-xs px-2 py-1 rounded-lg font-medium">Remove</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => vehiclePhotoRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 text-gray-400 text-sm text-center">
              📷 Add a photo of your vehicle
            </button>
          )}
          <input ref={vehiclePhotoRef} type="file" accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const dataUrl = await compressImage(file, 1200, 0.8)
              const res = await fetch(dataUrl)
              const blob = await res.blob()
              const uploadFile = new File([blob], file.name, { type: blob.type })
              if (photoId) deleteImage(photoId)
              const { id } = await uploadImage(uploadFile)
              setPhotoId(id)
              e.target.value = ''
            }} className="hidden" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input type="number" value={form.year} onChange={e => set('year', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
            <input type="text" value={form.make} onChange={e => set('make', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input type="text" value={form.model} onChange={e => set('model', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
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
            <select value={form.engine || '4cyl'} onChange={e => set('engine', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="4cyl">4-Cylinder</option>
              <option value="V6">V6</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
          <input type="text" value={form.vin} onChange={e => set('vin', e.target.value.toUpperCase())}
            maxLength={17} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
            <input type="text" value={form.license} onChange={e => set('license', e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Mileage</label>
            <input type="number" value={form.currentMileage} onChange={e => set('currentMileage', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          {confirmDelete ? (
            <div className="space-y-2">
              <p className="text-sm text-red-600 font-medium text-center">Delete this vehicle and all its records?</p>
              <div className="flex gap-2">
                <button onClick={onDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold">Delete Forever</button>
                <button onClick={() => setConfirmDelete(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="w-full text-red-500 text-sm py-2 border border-red-200 rounded-lg">
              Delete Vehicle
            </button>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-200 p-4">
        <button onClick={handleSave} className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold">
          Save Changes
        </button>
      </div>
    </div>
  )
}
