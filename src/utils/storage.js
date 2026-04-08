import { v4 as uuidv4 } from 'uuid'
import { STARTER_VEHICLES } from '../data/starterVehicles'
import { buildOdysseyRecords } from '../data/odysseyRecords'

const KEYS = {
  vehicles: 'vmtracker_vehicles',
  records: 'vmtracker_records',
  settings: 'vmtracker_settings',
  initialized: 'vmtracker_initialized',
}

export function initializeData() {
  if (localStorage.getItem(KEYS.initialized)) return

  const vehicles = STARTER_VEHICLES.map(v => ({ ...v, id: uuidv4() }))
  const odyssey = vehicles.find(v => v.vin === '5FNRL5H60CB117944')
  const records = odyssey ? buildOdysseyRecords(odyssey.id) : []

  localStorage.setItem(KEYS.vehicles, JSON.stringify(vehicles))
  localStorage.setItem(KEYS.records, JSON.stringify(records))
  localStorage.setItem(KEYS.settings, JSON.stringify({ militaryDiscount: true }))
  localStorage.setItem(KEYS.initialized, '1')
}

export function getVehicles() {
  return JSON.parse(localStorage.getItem(KEYS.vehicles) || '[]')
}

export function saveVehicles(vehicles) {
  localStorage.setItem(KEYS.vehicles, JSON.stringify(vehicles))
}

export function getRecords() {
  return JSON.parse(localStorage.getItem(KEYS.records) || '[]')
}

export function saveRecords(records) {
  localStorage.setItem(KEYS.records, JSON.stringify(records))
}

export function getSettings() {
  return JSON.parse(localStorage.getItem(KEYS.settings) || '{}')
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings))
}

export function getApiKey() {
  return getSettings().anthropicApiKey || null
}

export function saveApiKey(key) {
  const settings = getSettings()
  saveSettings({ ...settings, anthropicApiKey: key })
}

export function addVehicle(vehicle) {
  const vehicles = getVehicles()
  const newVehicle = { ...vehicle, id: uuidv4() }
  vehicles.push(newVehicle)
  saveVehicles(vehicles)
  return newVehicle
}

export function updateVehicle(updated) {
  const vehicles = getVehicles().map(v => v.id === updated.id ? updated : v)
  saveVehicles(vehicles)
}

export function deleteVehicle(id) {
  saveVehicles(getVehicles().filter(v => v.id !== id))
  saveRecords(getRecords().filter(r => r.vehicleId !== id))
}

export function addRecord(record) {
  const records = getRecords()
  const newRecord = { ...record, id: uuidv4() }
  records.push(newRecord)
  saveRecords(records)
  return newRecord
}

export function updateRecord(updated) {
  saveRecords(getRecords().map(r => r.id === updated.id ? updated : r))
}

export function deleteRecord(id) {
  saveRecords(getRecords().filter(r => r.id !== id))
}

export function getVehicleRecords(vehicleId) {
  return getRecords()
    .filter(r => r.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

const IMAGE_KEY = 'vmtracker_images'

export function getImages() {
  try { return JSON.parse(localStorage.getItem(IMAGE_KEY) || '{}') } catch { return {} }
}

export function saveImage(imageId, dataUrl) {
  const images = getImages()
  images[imageId] = dataUrl
  localStorage.setItem(IMAGE_KEY, JSON.stringify(images))
}

export function deleteImage(imageId) {
  const images = getImages()
  delete images[imageId]
  localStorage.setItem(IMAGE_KEY, JSON.stringify(images))
}

export function getImage(imageId) {
  return getImages()[imageId] || null
}
