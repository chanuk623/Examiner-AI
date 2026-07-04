import React, { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { useLang } from '../i18n.jsx'

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

export default function FileUploader({ onUpload, onClose }) {
  const { t } = useLang()
  
  // Initialize from global cache if available, otherwise fall back to first category
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return window.__android_global_category_cache || t.categories[0]
  })
  const [queued, setQueued] = useState([])

  // 1. Synchronize file queue state on component initialization
  useEffect(() => {
    if (window.__android_global_file_cache) {
      setQueued(window.__android_global_file_cache)
    }

    const handleIncomingFiles = (e) => {
      if (e.detail) {
        console.log("📱 [MODAL INTERCEPT] Captured files from background stream:", e.detail)
        setQueued(e.detail)
      }
    }

    window.addEventListener('android_global_file_stream', handleIncomingFiles)
    return () => {
      window.removeEventListener('android_global_file_stream', handleIncomingFiles)
    }
  }, [])

  // 2. Initialize the isolated native system interface input element
  useEffect(() => {
    if (!document.getElementById('android-persistent-hidden-input')) {
      const input = document.createElement('input')
      input.type = 'file'
      input.id = 'android-persistent-hidden-input'
      input.multiple = true
      input.accept = '*/*' 
      input.style.cssText = 'position: fixed; top: -100px; left: -100px; width: 1px; height: 1px; opacity: 0; z-index: -1;'
      
      input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const filesArray = Array.from(e.target.files)
          window.__android_global_file_cache = filesArray
          
          const event = new CustomEvent('android_global_file_stream', { detail: filesArray })
          window.dispatchEvent(event)
        }
      })

      document.body.appendChild(input)
    }
  }, [])

  // Standard dropzone action handler for drag and drop desktop actions
  const onDrop = useCallback((accepted) => {
    if (!accepted || accepted.length === 0) return
    setQueued(prev => {
      const updated = [...prev, ...accepted]
      window.__android_global_file_cache = updated
      return updated
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: ACCEPTED, 
    multiple: true,
    noKeyboard: true 
  })

  function removeQueued(idx) { 
    setQueued(prev => {
      const updated = prev.filter((_, i) => i !== idx)
      window.__android_global_file_cache = updated.length > 0 ? updated : null
      return updated
    })
  }

  // Intercept selection interactions to route around React state unmount traps
  function triggerSystemPicker(e) {
    e.preventDefault()
    e.stopPropagation()
    console.log("📂 Redirecting interaction hook straight to background DOM node...")
    document.getElementById('android-persistent-hidden-input')?.click()
  }

  // Monitor category updates and sync to persistent window thread
  function handleCategoryChange(e) {
    const val = e.target.value
    console.log("🎯 Category cache updated to:", val)
    setSelectedCategory(val)
    window.__android_global_category_cache = val // Cache instantly
  }

  function handleUpload(e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (queued.length === 0) return
    
    // Explicitly grab the value from local state or global cache fallback
    const targetCategory = selectedCategory || window.__android_global_category_cache || t.categories[0]
    
    console.log("🚀 Submitting files with verified category:", targetCategory)
    onUpload(queued, targetCategory)
    
    // Completely wipe persistent global context targets on completion
    window.__android_global_file_cache = null
    window.__android_global_category_cache = null
    
    const backgroundInput = document.getElementById('android-persistent-hidden-input')
    if (backgroundInput) backgroundInput.value = ''
    
    setQueued([]) 
    onClose()
  }

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(10,25,41,0.92)',
        display: 'flex', alignItems: 'flex-end',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: '16px 16px 0 0',
        padding: 20, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{t.uploadTitle}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.uploadSubtitle}</div>
          </div>
          <button type="button" onClick={onClose} style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', center: 'center',
            color: 'var(--text-secondary)',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Category picker */}
        <div>
          <label 
            htmlFor="uploader-category-select"
            style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}
          >
            {t.categoryLabel}
          </label>
          <select
            id="uploader-category-select"
            name="document_category"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="input" 
            style={{ marginTop: 6, width: '100%' }}
          >
            {t.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Drop zone container element */}
        <div 
          {...getRootProps()}
          onClick={triggerSystemPicker}
          style={{
            display: 'block',
            border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
            background: isDragActive ? 'rgba(232,160,32,0.05)' : 'var(--surface-2)',
            transition: 'all 0.15s',
          }}
        >
          <input {...getInputProps()} style={{ display: 'none' }} />
          <Upload size={28} color={isDragActive ? 'var(--accent)' : 'var(--text-muted)'} style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 14, color: isDragActive ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 500 }}>
            {isDragActive ? t.dropzoneActive : t.dropzone}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{t.dropzoneTypes}</div>
        </div>

        {/* Queued files */}
        {queued.length > 0 && (
          <div style={{ overflowY: 'auto', maxHeight: 160 }} className="scroll">
            {queued.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 6, background: 'var(--surface-2)', marginBottom: 6,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }} className="truncate">{f.name}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); removeQueued(i); }} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4,
                }}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>{t.cancel}</button>
          <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={handleUpload} disabled={queued.length === 0}>
            {t.uploadFiles(queued.length)}
          </button>
        </div>
      </div>
    </div>
  )
}