// Orchestrates all file parsers and determines file type
import { parsePdf } from './pdfParser.js'
import { parseExcel } from './excelParser.js'
import { parseWord } from './wordParser.js'

export const SUPPORTED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
  'application/vnd.ms-excel': 'excel',
  'text/csv': 'excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
  'application/msword': 'word',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/heic': 'image',
}

export function getFileType(file) {
  return SUPPORTED_TYPES[file.type] || null
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Process a file and return extracted text + metadata
 * Images are returned as base64 for Gemini Vision
 */
export async function processFile(file) {
  const fileType = getFileType(file)
  if (!fileType) throw new Error(`Unsupported file type: ${file.type}`)

  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  if (fileType === 'image') {
    const base64 = await fileToBase64(file)
    return {
      id,
      name: file.name,
      type: fileType,
      size: file.size,
      isImage: true,
      base64,
      mimeType: file.type,
      text: '', // will be extracted by Gemini Vision when queried
    }
  }

  let text = ''
  if (fileType === 'pdf') text = await parsePdf(file)
  else if (fileType === 'excel') text = await parseExcel(file)
  else if (fileType === 'word') text = await parseWord(file)

  return {
    id,
    name: file.name,
    type: fileType,
    size: file.size,
    isImage: false,
    base64: null,
    mimeType: file.type,
    text,
  }
}
