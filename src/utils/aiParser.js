import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are an expert at parsing auto service invoices. Extract structured data accurately and completely.`

const PARSE_PROMPT = `Parse this auto service invoice/receipt and return ONLY a valid JSON object with this exact structure:

{
  "date": "YYYY-MM-DD",
  "mileage": 12345,
  "shop": "Shop Name - City, State",
  "invoiceNumber": "12345",
  "totalCost": 123.45,
  "services": [
    {"description": "Service description", "category": "routine", "cost": 0.00}
  ],
  "notes": "Any relevant tech notes or observations"
}

Rules:
- date: use the invoice date (INV. DATE or Invoice Date field)
- mileage: use the "mileage in" or odometer reading (the first/lower number if two are shown)
- shop: include the shop name and city/state, e.g. "Shockley Honda - Frederick, MD"
- invoiceNumber: the RO, invoice, or work order number
- totalCost: the "Please Pay This Amount", "Total Invoice $", or final amount paid (0 if warranty/free)
- services: include EVERY line item — parts, labor, fees, taxes, discounts
  - category must be one of: routine, repair, major, brakes, fluid, recall, fees, discount
  - routine: oil change, tire rotation, air filter, cabin filter, multi-point inspection
  - repair: parts replaced, bearing, battery, CV axle, steering
  - major: timing belt, spark plugs, ignition coils, water pump, tensioner
  - brakes: brake pads, rotors, brake fluid exchange
  - fluid: transmission fluid, coolant flush, power steering fluid
  - recall: safety recall work (always cost 0)
  - fees: environmental fees, shop fees, taxes, hazmat disposal
  - discount: military discount, meet-or-beat, coupons (negative cost values)
- notes: include tech findings, diagnostic notes, anything notable
- For discounts, the cost must be NEGATIVE (e.g. -128.71)

Return ONLY the JSON object, no markdown, no explanation.`

export async function parseReceiptWithAI(file, apiKey) {
  const resolvedKey = import.meta.env.VITE_ANTHROPIC_API_KEY || apiKey
  if (!resolvedKey) throw new Error('No API key configured. Add VITE_ANTHROPIC_API_KEY to .env or set it in Settings.')

  const client = new Anthropic({
    apiKey: resolvedKey,
    dangerouslyAllowBrowser: true,
  })

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i])
  }
  const base64 = btoa(binary)

  const isPDF = file.type === 'application/pdf'

  // Build content block based on file type
  const fileBlock = isPDF
    ? {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      }
    : {
        type: 'image',
        source: {
          type: 'base64',
          media_type: normalizeImageType(file.type),
          data: base64,
        },
      }

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [fileBlock, { type: 'text', text: PARSE_PROMPT }],
      },
    ],
  })

  const text = response.content.find(b => b.type === 'text')?.text?.trim()
  if (!text) throw new Error('No response from AI parser')

  // Extract JSON — handle cases where model adds extra text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not extract JSON from AI response')

  const parsed = JSON.parse(jsonMatch[0])

  // Normalize and validate
  return {
    date: parsed.date || new Date().toISOString().split('T')[0],
    mileage: parseInt(parsed.mileage) || 0,
    shop: parsed.shop || '',
    invoiceNumber: String(parsed.invoiceNumber || ''),
    totalCost: parseFloat(parsed.totalCost) || 0,
    services: (parsed.services || []).map(s => ({
      description: s.description || '',
      category: s.category || 'routine',
      cost: parseFloat(s.cost) || 0,
    })),
    notes: parsed.notes || '',
    source: 'pdf_upload',
  }
}

function normalizeImageType(mimeType) {
  // Claude supports: image/jpeg, image/png, image/gif, image/webp
  const map = {
    'image/jpg': 'image/jpeg',
    'image/jpeg': 'image/jpeg',
    'image/png': 'image/png',
    'image/gif': 'image/gif',
    'image/webp': 'image/webp',
    'image/heic': 'image/jpeg', // iPhone HEIC — browsers often convert, fallback to jpeg
    'image/heif': 'image/jpeg',
  }
  return map[mimeType.toLowerCase()] || 'image/jpeg'
}
