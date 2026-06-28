import React, { useState } from 'react'
import { Filter, ChevronDown } from 'lucide-react'
import { useLang } from '../i18n.jsx'

export default function KnowledgeSelector({ availableCategories, selectedCategories, onChange }) {
  const [open, setOpen] = useState(false)
  const { t } = useLang()

  const allSelected = selectedCategories.length === 0 || selectedCategories.length === availableCategories.length

  function toggleCategory(cat) {
    if (selectedCategories.includes(cat)) {
      const next = selectedCategories.filter(c => c !== cat)
      onChange(next.length === availableCategories.length ? [] : next)
    } else {
      const next = [...selectedCategories, cat]
      onChange(next.length === availableCategories.length ? [] : next)
    }
  }

  function selectAll() {
    onChange([])
    setOpen(false)
  }

  const label = allSelected
    ? t.allSources
    : t.sourcesSelected(selectedCategories.length)

  if (availableCategories.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
          color: allSelected ? 'var(--text-secondary)' : 'var(--accent)',
          fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        <Filter size={12} />
        {label}
        <ChevronDown size={11} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', bottom: '110%', left: 0,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, minWidth: 240, zIndex: 50,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 14px', fontSize: 11, fontWeight: 700,
              color: 'var(--text-muted)', letterSpacing: '0.08em',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              {t.knowledgeBaseLabel}
              <button onClick={selectAll} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--accent)', fontSize: 11, fontWeight: 600
              }}>
                {t.selectAll}
              </button>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }} className="scroll">
              {availableCategories.map(cat => {
                const checked = selectedCategories.length === 0 || selectedCategories.includes(cat)
                return (
                  <label key={cat} className="checkbox-item">
                    <input type="checkbox" checked={checked} onChange={() => toggleCategory(cat)} />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{cat}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
