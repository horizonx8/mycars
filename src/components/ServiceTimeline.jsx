import { useState } from 'react'
import { getImageUrl } from '../utils/api'

const CATEGORY_COLORS = {
  routine: 'bg-blue-100 text-blue-700',
  repair: 'bg-orange-100 text-orange-700',
  major: 'bg-purple-100 text-purple-700',
  brakes: 'bg-red-100 text-red-700',
  fluid: 'bg-cyan-100 text-cyan-700',
  recall: 'bg-yellow-100 text-yellow-700',
  fees: 'bg-gray-100 text-gray-600',
  discount: 'bg-green-100 text-green-700',
}

export default function ServiceTimeline({ records, onAddRecord, onDeleteRecord, onEditRecord, searchQuery }) {
  const [expanded, setExpanded] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [viewingPhoto, setViewingPhoto] = useState(null)

  const filteredRecords = searchQuery
    ? records.filter(r => {
        const q = searchQuery.toLowerCase()
        return (
          r.shop?.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q) ||
          r.invoiceNumber?.toLowerCase().includes(q) ||
          (r.services || []).some(s => s.description?.toLowerCase().includes(q))
        )
      })
    : records

  const totalSpent = records.reduce((sum, r) => sum + (r.totalCost || 0), 0)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-800">Service History</h2>
          <p className="text-xs text-gray-400">
            {searchQuery ? `${filteredRecords.length} of ${records.length} records` : `${records.length} records`}
            {' '}· ${totalSpent.toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2})} total
          </p>
        </div>
        <button onClick={onAddRecord} className="bg-red-600 text-white text-sm px-3 py-1.5 rounded-lg font-medium">
          + Add
        </button>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">{searchQuery ? '🔍' : '📋'}</p>
          <p>{searchQuery ? `No records matching "${searchQuery}"` : 'No service records yet.'}</p>
          {!searchQuery && (
            <button onClick={onAddRecord} className="mt-3 text-red-600 font-medium text-sm">Add first record →</button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-4">
            {filteredRecords.map((record, idx) => (
              <div key={record.id} className="relative pl-10">
                <div className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                  idx === 0 ? 'bg-red-500' : 'bg-gray-400'
                }`} />

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                    className="w-full text-left px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{record.date}</span>
                          {record.invoiceNumber && record.invoiceNumber !== 'PENDING' && (
                            <span className="text-xs text-gray-400">#{record.invoiceNumber}</span>
                          )}
                          {record.invoiceNumber === 'PENDING' && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">PENDING</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{record.shop}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{record.mileage.toLocaleString()} mi</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-800">
                          {record.totalCost === 0 ? 'FREE' : `$${record.totalCost.toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2})}`}
                        </p>
                        <span className="text-gray-400 text-xs">{expanded === record.id ? '▲' : '▼'}</span>
                      </div>
                    </div>
                  </button>

                  {expanded === record.id && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                      <div className="space-y-1.5">
                        {(record.services || []).map((svc, i) => (
                          <div key={i} className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${CATEGORY_COLORS[svc.category] || 'bg-gray-100 text-gray-600'}`}>
                                {svc.category}
                              </span>
                              <span className="text-sm text-gray-700 leading-tight">{svc.description}</span>
                            </div>
                            {svc.cost !== 0 && (
                              <span className={`text-sm font-medium shrink-0 ${svc.cost < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                                {svc.cost < 0 ? `-$${Math.abs(svc.cost).toFixed(2)}` : `$${svc.cost.toFixed(2)}`}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {record.notes && (
                        <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded p-2 italic">{record.notes}</p>
                      )}
                      {(record.photoIds || []).length > 0 && (
                        <div className="mt-3 grid grid-cols-4 gap-1.5">
                          {record.photoIds.map(photoId => {
                            const src = getImageUrl(photoId)
                            if (!src) return null
                            return (
                              <img key={photoId} src={src} alt="" className="aspect-square object-cover rounded-lg cursor-pointer"
                                onClick={() => setViewingPhoto(src)} />
                            )
                          })}
                        </div>
                      )}
                      <div className="mt-3 flex gap-2 justify-end">
                        {deleteConfirm === record.id ? (
                          <>
                            <span className="text-xs text-gray-500 self-center">Delete this record?</span>
                            <button
                              onClick={() => { onDeleteRecord(record.id); setDeleteConfirm(null) }}
                              className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg"
                            >Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-xs border border-gray-300 px-3 py-1 rounded-lg">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => onEditRecord && onEditRecord(record)}
                              className="text-xs text-blue-600 border border-blue-200 px-3 py-1 rounded-lg">Edit</button>
                            <button
                              onClick={() => setDeleteConfirm(record.id)}
                              className="text-xs text-red-500 border border-red-200 px-3 py-1 rounded-lg"
                            >Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewingPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(null)}>
          <img src={viewingPhoto} alt="" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  )
}
