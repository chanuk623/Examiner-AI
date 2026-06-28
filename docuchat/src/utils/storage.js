import { supabase, STORAGE_BUCKET, MAX_STORAGE_BYTES } from './supabase.js'

// Upload file to Supabase Storage + save metadata to DB
export async function uploadDocument(file, userId, category, extractedText) {
  // Build storage path: userId/timestamp_filename
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${userId}/${timestamp}_${safeName}`

  // Upload actual file to Storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) throw new Error('Upload failed: ' + uploadError.message)

  // Save metadata to documents table
  const isImage = file.type.startsWith('image/')
  const { data: doc, error: dbError } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      name: file.name,
      category,
      file_type: getFileTypeName(file.type),
      size_bytes: file.size,
      storage_path: storagePath,
      is_image: isImage,
      mime_type: file.type,
    })
    .select()
    .single()

  if (dbError) {
    // Cleanup storage if DB insert fails
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
    throw new Error('Database error: ' + dbError.message)
  }

  // Update user storage usage
  await supabase.rpc('update_storage_used', {
    p_user_id: userId,
    p_bytes: file.size,
  })

  return { ...doc, extractedText }
}

// Load all documents for a user (metadata from DB)
export async function loadUserDocuments(userId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to load documents: ' + error.message)
  return data || []
}

// Get a signed URL to download/view a file
export async function getFileUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 3600) // 1 hour expiry
  if (error) return null
  return data.signedUrl
}

// Download file as ArrayBuffer for parsing
export async function downloadFileBuffer(storagePath) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(storagePath)
  if (error) throw new Error('Download failed: ' + error.message)
  return data // Blob
}

// Delete a document (storage + DB)
export async function deleteDocument(docId, storagePath, userId, sizeBytes) {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath])

  if (storageError) throw new Error('Storage delete failed: ' + storageError.message)

  // Delete from DB
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', docId)

  if (dbError) throw new Error('DB delete failed: ' + dbError.message)

  // Update storage usage (subtract)
  await supabase.rpc('update_storage_used', {
    p_user_id: userId,
    p_bytes: -Math.abs(sizeBytes),
  })
}

// Get user storage usage
export async function getStorageUsage(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('storage_used_bytes')
    .eq('id', userId)
    .single()
  if (error) return 0
  return data.storage_used_bytes || 0
}

// Format bytes for display
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Storage percentage
export function storagePercent(usedBytes) {
  return Math.min(100, (usedBytes / MAX_STORAGE_BYTES) * 100)
}

function getFileTypeName(mimeType) {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('word')) return 'word'
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'excel'
  if (mimeType.startsWith('image/')) return 'image'
  return 'other'
}
