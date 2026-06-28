import React from 'react'
import { HardDrive, AlertTriangle } from 'lucide-react'
import { formatBytes, storagePercent } from '../utils/storage.js'
import { MAX_STORAGE_BYTES } from '../utils/supabase.js'

export default function StorageBanner({ usedBytes }) {
  const percent = storagePercent(usedBytes)
  const isWarning = percent >= 70
  const isCritical = percent >= 90

  const color = isCritical ? 'var(--danger)' : isWarning ? 'var(--accent)' : 'var(--success)'
  const bg = isCritical ? '#2a0a0a' : isWarning ? '#2a1500' : '#0a1a0a'
  const border = isCritical ? '#5a1515' : isWarning ? '#3a2000' : '#0f2a0f'

  if (percent < 50 && !isWarning) return null // hide when plenty of space

  return (
    <div style={{
      background: bg,
      borderBottom: `1px solid ${border}`,
      padding: '7px 14px',
      display: 'flex', alignItems: 'center', gap: 8,
      flexShrink: 0,
    }}>
      {isCritical || isWarning
        ? <AlertTriangle size={13} color={color} style={{ flexShrink: 0 }} />
        : <HardDrive size={13} color={color} style={{ flexShrink: 0 }} />
      }
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color }}>
            {isCritical ? '⚠️ Storage almost full' : isWarning ? 'Storage filling up' : 'Storage'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {formatBytes(usedBytes)} / {formatBytes(MAX_STORAGE_BYTES)}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${percent}%`,
            background: color,
            borderRadius: 2,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>
        {percent.toFixed(0)}%
      </span>
    </div>
  )
}
