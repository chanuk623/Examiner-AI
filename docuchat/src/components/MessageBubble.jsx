import React from 'react'
import { Bot, User, FileText } from 'lucide-react'

function formatMessage(text) {
  // Convert **bold** and parse source citations nicely
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/📄 Source:(.*?)(\n|$)/g, '<span class="source-tag">📄 Source:$1</span>$2')
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isError = message.isError

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 8,
      padding: '4px 12px',
      alignItems: 'flex-end',
    }}>
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'var(--navy-600)' : isError ? '#3a1515' : 'var(--navy-700)',
        border: `1px solid ${isUser ? 'var(--navy-500)' : isError ? '#5a2020' : 'var(--accent)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser
          ? <User size={14} color="var(--text-secondary)" />
          : <Bot size={14} color={isError ? 'var(--danger)' : 'var(--accent)'} />
        }
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Attached file tag */}
        {message.attachedFile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--surface-3)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '4px 8px', fontSize: 11,
            color: 'var(--text-secondary)', alignSelf: isUser ? 'flex-end' : 'flex-start',
          }}>
            <FileText size={11} color="var(--accent)" />
            {message.attachedFile}
          </div>
        )}

        <div style={{
          background: isUser ? 'var(--navy-600)' : isError ? '#1a0808' : 'var(--surface)',
          border: `1px solid ${isUser ? 'var(--navy-500)' : isError ? '#5a1515' : 'var(--border)'}`,
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          padding: '10px 14px',
          fontSize: 14,
          lineHeight: 1.6,
          color: isError ? 'var(--danger)' : 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
          dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
        />

        <div style={{
          fontSize: 10, color: 'var(--text-muted)',
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          paddingLeft: isUser ? 0 : 4,
          paddingRight: isUser ? 4 : 0,
        }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <style>{`
        .source-tag {
          display: block;
          margin-top: 8px;
          padding: 6px 10px;
          background: var(--surface-3);
          border-left: 2px solid var(--accent);
          border-radius: 4px;
          font-size: 12px;
          color: var(--text-secondary);
          font-style: italic;
        }
        strong { color: var(--accent-soft); }
      `}</style>
    </div>
  )
}
