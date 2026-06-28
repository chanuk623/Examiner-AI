// Brain Manager — builds and manages the in-memory second brain (brain.md)
// Each document gets summarized into structured bullet points
// Only relevant sections are injected per query to save context window

const brain = {
  documents: {},   // { docId: { name, category, summary, fullText, type } }
}

/**
 * Add a document to the brain after upload + parse
 */
export function addDocumentToBrain({ id, name, category, text, type, isImage, base64, mimeType }) {
  brain.documents[id] = {
    id, name, category, type,
    fullText: text || '',
    isImage: isImage || false,
    base64: base64 || null,
    mimeType: mimeType || null,
    addedAt: new Date().toISOString(),
  }
}

/**
 * Remove a document from the brain
 */
export function removeDocumentFromBrain(id) {
  delete brain.documents[id]
}

/**
 * Get all documents in the brain
 */
export function getAllDocuments() {
  return Object.values(brain.documents)
}

/**
 * Get documents filtered by selected categories
 */
export function getDocumentsByCategories(selectedCategories) {
  if (!selectedCategories || selectedCategories.length === 0) {
    return Object.values(brain.documents)
  }
  return Object.values(brain.documents).filter(doc =>
    selectedCategories.includes(doc.category)
  )
}

/**
 * Build the brain.md context string from selected documents
 * Only includes text documents (not raw images — those go as vision)
 */
export function buildBrainContext(selectedCategories) {
  const docs = getDocumentsByCategories(selectedCategories)
  const textDocs = docs.filter(d => !d.isImage && d.fullText)

  if (textDocs.length === 0) return ''

  let brain_md = '# KNOWLEDGE BASE\n\n'
  for (const doc of textDocs) {
    brain_md += `## [${doc.category}] ${doc.name}\n`
    brain_md += `${doc.fullText}\n\n`
    brain_md += '---\n\n'
  }
  return brain_md
}

/**
 * Get image documents for vision API calls
 */
export function getImageDocuments(selectedCategories) {
  const docs = getDocumentsByCategories(selectedCategories)
  return docs.filter(d => d.isImage && d.base64)
}

/**
 * Get available categories from uploaded docs
 */
export function getAvailableCategories() {
  const cats = new Set(Object.values(brain.documents).map(d => d.category))
  return Array.from(cats)
}

/**
 * Count documents
 */
export function getDocumentCount() {
  return Object.keys(brain.documents).length
}
