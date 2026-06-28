// Excel / CSV text extraction using SheetJS
export async function parseExcel(file) {
  const XLSX = await import('xlsx')
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  let fullText = ''
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    if (csv.trim()) {
      fullText += `[Sheet: ${sheetName}]\n${csv}\n\n`
    }
  }
  return fullText.trim()
}
