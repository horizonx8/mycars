const BASE = '/api'

async function req(method, path, body) {
  const opts = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  }
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `API error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

// Normalize snake_case API responses to camelCase for the frontend
function normalizeVehicle(v) {
  if (!v) return null
  return { ...v, currentMileage: v.current_mileage, photoId: v.photo_id }
}

function normalizeRecord(r) {
  if (!r) return null
  return {
    ...r,
    vehicleId: r.vehicle_id,
    invoiceNumber: r.invoice_number,
    totalCost: r.total_cost,
    photoIds: r.photo_ids || [],
  }
}

// Vehicles
export const getVehicles = () => req('GET', '/vehicles').then(vs => vs.map(normalizeVehicle))

export const createVehicle = (data) => req('POST', '/vehicles', {
  year: parseInt(data.year) || 0,
  make: data.make || '',
  model: data.model || '',
  trim: data.trim || '',
  color: data.color || '',
  vin: data.vin || '',
  license: data.license || '',
  current_mileage: parseInt(data.currentMileage || data.current_mileage) || 0,
  engine: data.engine || '4cyl',
  photo_id: data.photoId || data.photo_id || null,
}).then(normalizeVehicle)

export const updateVehicle = (data) => req('PUT', `/vehicles/${data.id}`, {
  id: data.id,
  year: parseInt(data.year) || 0,
  make: data.make || '',
  model: data.model || '',
  trim: data.trim || '',
  color: data.color || '',
  vin: data.vin || '',
  license: data.license || '',
  current_mileage: parseInt(data.currentMileage || data.current_mileage) || 0,
  engine: data.engine || '4cyl',
  photo_id: data.photoId || data.photo_id || null,
}).then(normalizeVehicle)

export const deleteVehicle = (id) => req('DELETE', `/vehicles/${id}`)

// Records
export const getVehicleRecords = (vehicleId) =>
  req('GET', `/vehicles/${vehicleId}/records`).then(rs => rs.map(normalizeRecord))

export const createRecord = (data) => req('POST', '/records', {
  vehicle_id: data.vehicleId || data.vehicle_id,
  date: data.date,
  mileage: parseInt(data.mileage) || 0,
  shop: data.shop || '',
  invoice_number: data.invoiceNumber || data.invoice_number || '',
  total_cost: parseFloat(data.totalCost || data.total_cost) || 0,
  notes: data.notes || '',
  source: data.source || 'manual',
  services: (data.services || []).map(s => ({
    description: s.description,
    category: s.category || 'routine',
    cost: parseFloat(s.cost) || 0,
  })),
  photo_ids: data.photoIds || data.photo_ids || [],
}).then(normalizeRecord)

export const updateRecord = (data) => req('PUT', `/records/${data.id}`, {
  id: data.id,
  vehicle_id: data.vehicleId || data.vehicle_id,
  date: data.date,
  mileage: parseInt(data.mileage) || 0,
  shop: data.shop || '',
  invoice_number: data.invoiceNumber || data.invoice_number || '',
  total_cost: parseFloat(data.totalCost || data.total_cost) || 0,
  notes: data.notes || '',
  source: data.source || 'manual',
  services: (data.services || []).map(s => ({
    description: s.description,
    category: s.category || 'routine',
    cost: parseFloat(s.cost) || 0,
  })),
  photo_ids: data.photoIds || data.photo_ids || [],
}).then(normalizeRecord)

export const deleteRecord = (id) => req('DELETE', `/records/${id}`)

// Images
export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/images`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Image upload failed')
  return res.json() // { id, url }
}

export function getImageUrl(imageId) {
  return imageId ? `${BASE}/images/${imageId}` : null
}

export const deleteImage = (id) => req('DELETE', `/images/${id}`)

// Migration from localStorage
export async function migrateFromLocalStorage() {
  const vehicles = JSON.parse(localStorage.getItem('vmtracker_vehicles') || '[]')
  const records = JSON.parse(localStorage.getItem('vmtracker_records') || '[]')
  const images = JSON.parse(localStorage.getItem('vmtracker_images') || '{}')

  if (!vehicles.length && !records.length && !Object.keys(images).length) return false

  const res = await fetch(`${BASE}/migrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicles, records, images }),
  })
  if (!res.ok) throw new Error('Migration failed')

  localStorage.removeItem('vmtracker_vehicles')
  localStorage.removeItem('vmtracker_records')
  localStorage.removeItem('vmtracker_images')
  localStorage.removeItem('vmtracker_settings')
  localStorage.removeItem('vmtracker_initialized')

  return true
}
