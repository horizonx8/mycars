import { getAnnualCostEstimate } from '../utils/maintenanceSchedule'

export default function CostEstimator({ vehicle, upcoming }) {
  const annualEstimate = getAnnualCostEstimate(vehicle, [])
  const overdueItems = upcoming.filter(u => u.status === 'overdue')
  const dueSoonItems = upcoming.filter(u => u.status === 'due-soon' || u.status === 'upcoming')

  const immediateTotal = overdueItems.reduce((s, i) => s + i.estimatedCost, 0)
  const soonTotal = dueSoonItems.reduce((s, i) => s + i.estimatedCost, 0)

  const isMilitary = true // Denis always gets military discount
  const militaryDiscount = 0.10

  return (
    <div className="p-4 space-y-4">
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
        <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Estimated Annual Cost</p>
        <p className="text-3xl font-bold text-red-700 mt-1">${annualEstimate.toLocaleString()}</p>
        <p className="text-xs text-red-400 mt-1">Next 12,000 miles at Hampton VA dealer rates</p>
        {isMilitary && (
          <p className="text-xs text-green-600 mt-1">★ Military discount (~10%) may apply at Honda dealers</p>
        )}
      </div>

      {overdueItems.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <p className="text-sm font-semibold text-red-700 mb-3">⚠️ Immediate Needs (Overdue)</p>
          <div className="space-y-2">
            {overdueItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-medium">${item.estimatedCost.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between items-center font-semibold">
              <span>Subtotal</span>
              <span className="text-red-600">${immediateTotal.toLocaleString()}</span>
            </div>
            {isMilitary && (
              <p className="text-xs text-green-600">
                With 10% military discount: ~${(immediateTotal * (1 - militaryDiscount)).toLocaleString(undefined, {maximumFractionDigits:0})}
              </p>
            )}
          </div>
        </div>
      )}

      {dueSoonItems.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 p-4">
          <p className="text-sm font-semibold text-orange-700 mb-3">🔔 Coming Up Soon</p>
          <div className="space-y-2">
            {dueSoonItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-gray-700">{item.name}</span>
                  <p className="text-xs text-gray-400">in {item.milesUntilDue.toLocaleString()} miles</p>
                </div>
                <span className="font-medium">${item.estimatedCost.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between items-center font-semibold">
              <span>Subtotal</span>
              <span className="text-orange-600">${soonTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Dealer Reference</p>
        <p className="text-xs text-gray-500">Priority Honda Hampton</p>
        <p className="text-xs text-gray-500">4115 W Mercury Blvd, Hampton VA 23666</p>
        <p className="text-xs text-gray-400 mt-1">Estimates based on Hampton VA dealer rates. Military discount applies.</p>
      </div>
    </div>
  )
}
