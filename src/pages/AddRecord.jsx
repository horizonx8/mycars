import { useState, useRef, useEffect } from 'react'
import { getVehicles, createRecord, uploadImage, getImageUrl, deleteImage } from '../utils/api'
import { getApiKey } from '../utils/storage'
import { parseReceiptWithAI } from '../utils/aiParser'
import { compressImage } from '../utils/imageUtils'
import { v4 as uuidv4 } from 'uuid'

const CATEGORIES = ['routine', 'repair', 'major', 'brakes', 'fluid', 'recall', 'fees', 'discount']

export default function AddRecord({ vehicleId, onSave, onCancel, onOpenSettings }) {
  const [vehicles, setVehicles] = useState([])
  const fileInputRef = useRef(null)
  const photoInputRef = useRef(null)

  const [form, setForm] = useState({
    vehicleId: vehicleId || '',
    date: new Date().toISOString().split('T')[0],
    mileage: '',
    shop: '',
    invoiceNumber: '',
    totalCost: '',
    notes: '',
    services: [{ id: uuidv4(), description: '', category: 'routine', cost: '' }],
    source: 'manual',
  })

  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)
  const [photoIds, setPhotoIds] = useState([])
  const [viewPhoto, setViewPhoto] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getVehicles().then(vs => {
      setVehicles(vs)
      if (!vehicleId && vs.length > 0) {
        setForm(f => ({ ...f, vehicleId: f.vehicleId || vs[0].id }))
      }
    }).catch(() => {})
  }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const updateService = (idx, key, val) => {
    const services = [...form.services]
    services[idx] = { ...services[idx], [key]: val }
    set('services', services)
  }

  const addService = () =>
    set('services', [...form.services, { id: uuidv4(), description: '', category: 'routine', cost: '' }])

  const removeService = (idx) =>
    set('services', form.services.filter((_, i) => i !== idx))

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const apiKey = getApiKey()
    if (!apiKey && !import.meta.env.VITE_ANTHROPIC_API_KEY) {
      setParseError('No API key configured. Tap "Add API key in Settings" below.')
      return
    }

    setPreviewFile(file.name)
    setParsing(true)
    setParseError(null)

    try {
      const parsed = await parseReceiptWithAI(file, apiKey)
      setForm(f => ({
        ...f,
        date: parsed.date || f.date,
        mileage: parsed.mileage ? String(parsed.mileage) : f.mileage,
        shop: parsed.shop || f.shop,
        invoiceNumber: parsed.invoiceNumber || f.invoiceNumber,
        totalCost: parsed.totalCost !== undefined ? String(parsed.totalCost) : f.totalCost,
        notes: parsed.notes || f.notes,
        services: parsed.services?.length
          ? parsed.services.map(s => ({ ...s, id: uuidv4(), cost: String(s.cost) }))
          : f.services,
        source: 'pdf_upload',
      }))
    } catch (err) {
      setParseError(err.message || 'Failed to parse receipt. Please fill in manually.')
    } finally {
      setParsing(false)
      e.target.value = ''
    }
  }

  const handleAddPhoto = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      try {
        const compressed = await compressImage(file)
        // Convert data URL to blob for upload
        const res = await fetch(compressed)
        const blob = await res.blob()
        const uploadFile = new File([blob], file.name, { type: blob.type })
        const { id } = await uploadImage(uploadFile)
        setPhotoIds(prev => [...prev, id])
      } catch (err) {
        console.error('Photo error:', err)
      }
    }
    e.target.value = ''
  }

  const handleDeletePhoto = async (photoId) => {
    await deleteImage(photoId)
    setPhotoIds(prev => prev.filter(id => id !== photoId))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createRecord({
        vehicleId: form.vehicleId,
        date: form.date,
        mileage: parseInt(form.mileage) || 0,
        shop: form.shop,
        invoiceNumber: form.invoiceNumber,
        totalCost: parseFloat(form.totalCost) || 0,
        notes: form.notes,
        services: form.services
          .filter(s => s.description.trim())
          .map(s => ({ description: s.description, category: s.category, cost: parseFloat(s.cost) || 0 })),
        source: form.source,
        photoIds,
      })
      onSave()
    } catch (err) {
      console.error('Save error:', err)
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-lg mx-auto">
      <header className="bg-red-600 text-white px-4 py-3 flex items-center gap-3">
        <button onClick={onCancel} className="text-red-200 hover:text-white text-xl">←</button>
        <h1 className="font-bold text-lg flex-1">Add Service Record</h1>
      </header>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-28">

        {/* AI Upload Banner */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-purple-800 mb-1">📷 AI Receipt Parser</p>
          <p className="text-xs text-purple-600 mb-3">
            Take a photo or upload a PDF — Claude AI fills in all fields automatically.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              parsing
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white active:bg-purple-700'
            }`}
          >
            {parsing ? '🔄 Parsing receipt...' : '📎 Upload Receipt / Take Photo'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {parsing && (
            <p className="text-xs text-purple-500 text-center mt-2 animate-pulse">
              Claude AI is reading your invoice...
            </p>
          )}
          {previewFile && !parsing && !parseError && (
            <p className="text-xs text-green-600 text-center mt-2 font-medium">
              ✓ Parsed: {previewFile} — review and save below
            </p>
          )}
          {parseError && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-600 font-medium">Could not parse receipt</p>
              <p className="text-xs text-red-500 mt-0.5">{parseError}</p>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-xs text-red-700 underline mt-1 font-medium"
                >
                  Add API key in Settings →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Vehicle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
          <select
            value={form.vehicleId}
            onChange={e => set('vehicleId', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            required
          >
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date" value={form.date}
              onChange={e => set('date', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
            <input
              type="number" value={form.mileage}
              onChange={e => set('mileage', e.target.value)}
              placeholder="e.g. 185000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop</label>
          <input
            type="text" value={form.shop}
            onChange={e => set('shop', e.target.value)}
            placeholder="e.g. Priority Honda Hampton - Hampton, VA"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice #</label>
            <input
              type="text" value={form.invoiceNumber}
              onChange={e => set('invoiceNumber', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total ($)</label>
            <input
              type="number" step="0.01" value={form.totalCost}
              onChange={e => set('totalCost', e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Services <span className="text-gray-400">({form.services.length} lines)</span>
            </label>
            <button type="button" onClick={addService} className="text-red-600 text-sm font-medium">
              + Add Line
            </button>
          </div>
          <div className="space-y-2">
            {form.services.map((svc, idx) => (
              <div key={svc.id} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text" value={svc.description}
                    onChange={e => updateService(idx, 'description', e.target.value)}
                    placeholder="Service description"
                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                  />
                  {form.services.length > 1 && (
                    <button
                      type="button" onClick={() => removeService(idx)}
                      className="text-gray-400 hover:text-red-500 text-xl leading-none px-1"
                    >×</button>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={svc.category}
                    onChange={e => updateService(idx, 'category', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="number" step="0.01" value={svc.cost}
                    onChange={e => updateService(idx, 'cost', e.target.value)}
                    placeholder="$0.00"
                    className="w-24 border border-gray-300 rounded px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Tech notes, observations, follow-up items..."
          />
        </div>

        {/* Photos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Photos ({photoIds.length})</label>
            <button type="button" onClick={() => photoInputRef.current?.click()}
              className="text-red-600 text-sm font-medium">+ Add Photo</button>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" multiple
            onChange={handleAddPhoto} className="hidden" />
          {photoIds.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photoIds.map(photoId => {
                const src = getImageUrl(photoId)
                if (!src) return null
                return (
                  <div key={photoId} className="relative aspect-square">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-lg cursor-pointer"
                      onClick={() => setViewPhoto(src)} />
                    <button onClick={() => handleDeletePhoto(photoId)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none">×</button>
                  </div>
                )
              })}
            </div>
          )}
          {photoIds.length === 0 && (
            <button type="button" onClick={() => photoInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 text-gray-400 text-sm text-center">
              📷 Add photos of parts, receipts, or damage
            </button>
          )}
        </div>

      </div>

      {viewPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewPhoto(null)}>
          <img src={viewPhoto} alt="" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-200 p-4">
        <button onClick={handleSubmit} disabled={saving}
          className={`w-full py-3 rounded-xl font-semibold ${saving ? 'bg-gray-300 text-gray-500' : 'bg-red-600 text-white'}`}>
          {saving ? 'Saving...' : 'Save Record'}
        </button>
      </div>
    </div>
  )
}
