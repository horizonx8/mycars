import { getImageUrl } from '../utils/api'

export default function VehicleCard({ vehicle, lastRecord, overdueCount, dueSoonCount, onClick }) {
  const statusDot = overdueCount > 0 ? 'bg-red-500' : dueSoonCount > 0 ? 'bg-orange-400' : 'bg-green-500'
  const statusText = overdueCount > 0
    ? `${overdueCount} overdue`
    : dueSoonCount > 0
    ? `${dueSoonCount} due soon`
    : 'Up to date'

  const photoSrc = vehicle.photoId ? getImageUrl(vehicle.photoId) : null

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow overflow-hidden"
    >
      {photoSrc && (
        <div className="w-full h-32 overflow-hidden">
          <img src={photoSrc} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">
              {vehicle.year} {vehicle.make} {vehicle.model}
              {vehicle.trim && <span className="text-gray-500 font-normal"> {vehicle.trim}</span>}
            </h3>
            {vehicle.color && (
              <p className="text-sm text-gray-400 mt-0.5">{vehicle.color} · {vehicle.license || 'No plate'}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${statusDot}`} />
            <span className="text-xs text-gray-500">{statusText}</span>
          </div>
        </div>

        <div className="mt-3 flex gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Mileage</p>
            <p className="font-semibold text-gray-800">{vehicle.currentMileage.toLocaleString()}</p>
          </div>
          {lastRecord && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Last Service</p>
              <p className="font-semibold text-gray-800">{lastRecord.date}</p>
            </div>
          )}
          {lastRecord && (
            <div className="flex-1">
              <p className="text-gray-400 text-xs uppercase tracking-wide">Shop</p>
              <p className="font-semibold text-gray-800 truncate">{lastRecord.shop.split(' - ')[0]}</p>
            </div>
          )}
        </div>

        {(overdueCount > 0 || dueSoonCount > 0) && (
          <div className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-medium ${
            overdueCount > 0 ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
          }`}>
            ⚠️ {overdueCount > 0 ? `${overdueCount} service(s) overdue` : `${dueSoonCount} service(s) due soon`}
          </div>
        )}

        <div className="mt-3 text-xs text-gray-400 text-right">Tap to view details →</div>
      </div>
    </button>
  )
}
