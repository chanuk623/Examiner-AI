import React, { useState } from 'react'
import { FileText, FileSpreadsheet, Image, File, Trash2, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react'
import { formatFileSize } from '../utils/fileProcessor.js'
import { useLang } from '../i18n.jsx'

const TYPE_ICONS = { pdf: FileText, excel: FileSpreadsheet, word: FileText, image: Image }
const TYPE_COLORS = { pdf: '#ef4444', excel: '#22c55e', word: '#3b82f6', image: '#a855f7' }

function DocItem({ doc, onRemove, onCategoryChange }) {
  const { t } = useLang()
  const Icon = TYPE_ICONS[doc.type] || File
  const color = TYPE_COLORS[doc.type] || '#7a9bbf'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderBottom: '1px solid var(--border)',
    }}>
      <Icon size={18} color={color} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {doc.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <select
            value={doc.category}
            onChange={e => onCategoryChange(doc.id, e.target.value)}
            style={{
              background: 'var(--surface-3)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--accent)', fontSize: 11, fontWeight: 600,
              padding: '2px 4px', cursor: 'pointer', outline: 'none', maxWidth: 160,
            }}
          >
            {t.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatFileSize(doc.size)}
          </span>
          {doc.isImage && (
            <span className="badge badge-blue" style={{ fontSize: 10 }}>{t.visionBadge}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onRemove(doc.id)}
        title={t.remove}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 4, borderRadius: 4,
          display: 'flex', alignItems: 'center',
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

export default function DocumentList({ documents, onRemove, onCategoryChange }) {
  const [collapsed, setCollapsed] = useState(false)
  const { t } = useLang()

  if (documents.length === 0) return null

  return (
    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: '100%', background: 'none', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', cursor: 'pointer', color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
          <FolderOpen size={14} color="var(--accent)" />
          {t.knowledgeBase}
          <span className="badge badge-amber">{documents.length}</span>
        </div>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      {!collapsed && (
        <div style={{ maxHeight: 220, overflowY: 'auto' }} className="scroll">
          {documents.map(doc => (
            <DocItem key={doc.id} doc={doc} onRemove={onRemove} onCategoryChange={onCategoryChange} />
          ))}
        </div>
      )}
    </div>
  )
}

export { }
