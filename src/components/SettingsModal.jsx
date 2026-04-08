import { useState } from 'react'
import { getSettings, saveSettings, getApiKey, saveApiKey } from '../utils/storage'

export default function SettingsModal({ onClose }) {
  const [apiKey, setApiKey] = useState(getApiKey() || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    saveApiKey(apiKey.trim())
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  const maskedKey = apiKey.length > 8
    ? apiKey.slice(0, 7) + '•'.repeat(Math.min(20, apiKey.length - 8)) + apiKey.slice(-4)
    : apiKey

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Anthropic API Key
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Required for AI-powered receipt parsing (photos + PDFs). Your key is stored only on this device.
              Get one at <span className="text-blue-600">console.anthropic.com</span>
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              autoComplete="off"
              spellCheck={false}
            />
            {apiKey.length > 8 && (
              <p className="text-xs text-gray-400 mt-1">Stored as: {maskedKey}</p>
            )}
          </div>

          <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">How AI receipt parsing works:</p>
            <p>• Tap "Upload Receipt" when adding a record</p>
            <p>• Take a photo or select a PDF from your camera roll</p>
            <p>• Claude AI reads the invoice and fills in all fields automatically</p>
            <p>• You review and confirm before saving</p>
            <p>• Works with Shockley Honda, Casey Honda, Priority Honda, Costco, Pep Boys and more</p>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-xl font-semibold transition-colors ${
              saved ? 'bg-green-500 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
