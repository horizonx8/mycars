export async function parsePDFInvoice(file) {
  // Dynamic import of pdfjs-dist
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    fullText += content.items.map(item => item.str).join(' ') + '\n'
  }

  return extractInvoiceData(fullText)
}

function extractInvoiceData(text) {
  const result = {
    date: null,
    mileage: null,
    shop: null,
    invoiceNumber: null,
    totalCost: null,
    services: [],
    rawText: text,
  }

  // Extract date patterns: DDMMMYY (e.g. 16APR18), MM/DD/YY, MM/DD/YYYY
  const dateMatch = text.match(/\b(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})\b/i)
  if (dateMatch) {
    const months = { JAN:1, FEB:2, MAR:3, APR:4, MAY:5, JUN:6, JUL:7, AUG:8, SEP:9, OCT:10, NOV:11, DEC:12 }
    const month = months[dateMatch[2].toUpperCase()]
    const year = parseInt(dateMatch[3]) + 2000
    result.date = `${year}-${String(month).padStart(2,'0')}-${dateMatch[1]}`
  } else {
    const dateMatch2 = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
    if (dateMatch2) {
      const year = dateMatch2[3].length === 2 ? `20${dateMatch2[3]}` : dateMatch2[3]
      result.date = `${year}-${String(dateMatch2[1]).padStart(2,'0')}-${String(dateMatch2[2]).padStart(2,'0')}`
    }
  }

  // Extract mileage
  const mileageMatch = text.match(/(?:MILEAGE\s*IN\s*\/?\s*OUT|ODOMETER|MILEAGE)[:\s]+(\d{5,6})/i)
  if (mileageMatch) {
    result.mileage = parseInt(mileageMatch[1])
  }

  // Extract invoice number
  const invMatch = text.match(/(?:INV(?:OICE)?\s*(?:NO|#|NUMBER)?)[:\s]*([A-Z0-9-]{5,15})/i)
  if (invMatch) result.invoiceNumber = invMatch[1].trim()

  // Extract total
  const totalMatch = text.match(/(?:PLEASE\s*PAY\s*THIS\s*AMOUNT|TOTAL\s*INVOICE\s*\$?|GRAND\s*TOTAL)[:\s]+\$?\s*([0-9,]+\.\d{2})/i)
  if (totalMatch) result.totalCost = parseFloat(totalMatch[1].replace(',', ''))

  // Extract shop name (first non-empty line that looks like a shop)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  for (const line of lines.slice(0, 10)) {
    if (line.match(/honda|toyota|ford|chevrolet|costco|pep boys|jiffy|midas|firestone/i)) {
      result.shop = line.substring(0, 60)
      break
    }
  }

  return result
}
