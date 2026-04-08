export const MAINTENANCE_ITEMS = [
  { id: 'oil', name: 'Oil & Filter Change', interval: 5000, cost: 85, category: 'routine' },
  { id: 'tireRotation', name: 'Tire Rotation', interval: 7500, cost: 30, category: 'routine' },
  { id: 'airFilter', name: 'Engine Air Filter', interval: 15000, cost: 40, category: 'routine' },
  { id: 'cabinFilter', name: 'Cabin Air Filter', interval: 15000, cost: 35, category: 'routine' },
  { id: 'brakeFluid', name: 'Brake Fluid Exchange', interval: 30000, cost: 130, category: 'fluid', yearInterval: 3 },
  { id: 'transFluid', name: 'Transmission Fluid', interval: 30000, cost: 150, category: 'fluid' },
  { id: 'coolantFlush', name: 'Coolant Flush', interval: 60000, cost: 120, category: 'fluid' },
  { id: 'sparkPlugs', name: 'Spark Plugs', interval: 60000, costV6: 300, cost4cyl: 180, category: 'major' },
  { id: 'timingBelt', name: 'Timing Belt + Water Pump + Tensioner', interval: 85000, costDealer: 1800, costIndie: 1000, v6Only: true, category: 'major' },
  { id: 'driveBelt', name: 'Drive Belt (Serpentine)', interval: 85000, cost: 120, category: 'major' },
  { id: 'brakePadsFront', name: 'Front Brake Pads', interval: 40000, cost: 200, category: 'brakes' },
  { id: 'brakePadsRear', name: 'Rear Brake Pads', interval: 50000, cost: 200, category: 'brakes' },
]

function getServiceCost(item, engine) {
  if (item.id === 'sparkPlugs') return engine === 'V6' ? item.costV6 : item.cost4cyl
  if (item.id === 'timingBelt') return item.costDealer
  return item.cost
}

// Map service record description keywords to maintenance item IDs
const SERVICE_KEYWORDS = {
  oil: ['oil', 'filter change', 'oil change'],
  tireRotation: ['tire rotation', 'rotate tire'],
  airFilter: ['air filter', 'engine air', 'air cleaner'],
  cabinFilter: ['cabin filter', 'cabin air'],
  brakeFluid: ['brake fluid', 'brake fluid exchange'],
  transFluid: ['transmission fluid', 'trans fluid', 'atf'],
  coolantFlush: ['coolant flush', 'coolant replacement', 'cooling system flush'],
  sparkPlugs: ['spark plug'],
  timingBelt: ['timing belt'],
  driveBelt: ['drive belt', 'serpentine'],
  brakePadsFront: ['front brake pad', 'front pad'],
  brakePadsRear: ['rear brake pad', 'rear pad'],
}

function getLastServiceMileage(records, itemId) {
  const keywords = SERVICE_KEYWORDS[itemId] || []
  for (const record of records) {
    for (const svc of (record.services || [])) {
      const desc = svc.description.toLowerCase()
      if (keywords.some(kw => desc.includes(kw))) {
        return { mileage: record.mileage, date: record.date }
      }
    }
  }
  return null
}

export function getUpcomingMaintenance(vehicle, records) {
  const sortedRecords = [...records].sort((a, b) => b.mileage - a.mileage)
  const currentMileage = vehicle.currentMileage
  const engine = vehicle.engine || '4cyl'

  return MAINTENANCE_ITEMS
    .filter(item => !item.v6Only || engine === 'V6')
    .map(item => {
      const last = getLastServiceMileage(sortedRecords, item.id)
      const lastMileage = last ? last.mileage : 0
      const dueMileage = lastMileage + item.interval
      const milesUntilDue = dueMileage - currentMileage
      const cost = getServiceCost(item, engine)

      let status = 'ok'
      if (milesUntilDue <= 0) status = 'overdue'
      else if (milesUntilDue <= 1000) status = 'due-soon'
      else if (milesUntilDue <= 2000) status = 'upcoming'

      return {
        ...item,
        lastMileage,
        lastDate: last?.date || null,
        dueMileage,
        milesUntilDue,
        status,
        estimatedCost: cost,
      }
    })
    .sort((a, b) => a.milesUntilDue - b.milesUntilDue)
}

export function getAnnualCostEstimate(vehicle, records) {
  const upcoming = getUpcomingMaintenance(vehicle, records)
  const avgMilesPerYear = 12000
  return upcoming
    .filter(item => item.milesUntilDue <= avgMilesPerYear)
    .reduce((sum, item) => sum + item.estimatedCost, 0)
}
