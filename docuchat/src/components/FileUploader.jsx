import React, { useCallback, useState } from 'react'
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
  const [selectedCategory, setSelectedCategory] = useState(t.categories[0])
  const [queued, setQueued] = useState([])

  const onDrop = useCallback((accepted) => {
    if (!accepted || accepted.length === 0) return
    setQueued(prev => [...prev, ...accepted])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: ACCEPTED, 
    multiple: true,
    noKeyboard: true 
  })

  // Get input props and inject required identity tags safely
  const nativeInputProps = getInputProps({
    id: 'mobile-file-picker-input',
    name: 'uploaded_files',
  })

  function removeQueued(idx) { setQueued(prev => prev.filter((_, i) => i !== idx)) }

  function handleUpload(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (queued.length === 0) return
    
    onUpload(queued, selectedCategory)
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
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Category picker - Fixed with HTML 'for' matching 'id' */}
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
            onChange={e => setSelectedCategory(e.target.value)}
            className="input" 
            style={{ marginTop: 6 }}
          >
            {t.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Drop zone / File Input container - Fixed with label wrapping for hidden input */}
        <label 
          htmlFor="mobile-file-picker-input"
          {...getRootProps()}
          style={{
            display: 'block',
            border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
            background: isDragActive ? 'rgba(232,160,32,0.05)' : 'var(--surface-2)',
            transition: 'all 0.15s',
          }}
        >
          <input {...nativeInputProps} />
          <Upload size={28} color={isDragActive ? 'var(--accent)' : 'var(--text-muted)'} style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 14, color: isDragActive ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 500 }}>
            {isDragActive ? t.dropzoneActive : t.dropzone}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{t.dropzoneTypes}</div>
        </label>

        {/* Queued files */}
        {queued.length > 0 && (
          <div style={{ overflowY: 'auto', maxHeight: 160 }} className="scroll">
            {queued.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 6, background: 'var(--surface-2)', marginBottom: 6,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }} className="truncate">{f.name}</span>
                <button type="button" onClick={() => removeQueued(i)} style={{
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