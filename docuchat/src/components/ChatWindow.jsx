import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X } from 'lucide-react'
import MessageBubble from './MessageBubble.jsx'
import KnowledgeSelector from './KnowledgeSelector.jsx'
import { askGemini } from '../utils/geminiClient.js'
import { buildBrainContext, getImageDocuments, getAvailableCategories } from '../utils/brainManager.js'
import { processFile, getFileType } from '../utils/fileProcessor.js'
import { useLang } from '../i18n.jsx'

function buildWelcomeMessage(t) {
  return {
    id: 'welcome',
    role: 'assistant',
    text: t.welcomeMessage,
    timestamp: Date.now(),
  }
}

export default function ChatWindow({ documents }) {
  const { t } = useLang()
  const [messages, setMessages] = useState(() => [buildWelcomeMessage(t)])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [attachedFile, setAttachedFile] = useState(null)
  const [processingAttach, setProcessingAttach] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const attachInputRef = useRef(null)
  const conversationHistory = useRef([])

  // Update welcome message when language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev[0]?.id === 'welcome') {
        return [buildWelcomeMessage(t), ...prev.slice(1)]
      }
      return prev
    })
  }, [t])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleAttachFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const type = getFileType(file)
    if (!type) { alert('Unsupported file type'); return }
    setProcessingAttach(true)
    try {
      const processed = await processFile(file)
      setAttachedFile({ name: file.name, text: processed.text, isImage: processed.isImage, base64: processed.base64, mimeType: processed.mimeType })
    } catch (err) {
      alert('Could not process file: ' + err.message)
    } finally {
      setProcessingAttach(false)
      e.target.value = ''
    }
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { id: Date.now(), role: 'user', text, timestamp: Date.now(), attachedFile: attachedFile?.name || null }
    setMessages(prev => [...prev, userMsg])
    conversationHistory.current.push({ role: 'user', text })
    setInput('')
    const currentAttach = attachedFile
    setAttachedFile(null)
    setLoading(true)

    try {
      const brainContext = buildBrainContext(selectedCategories)
      const imageDocuments = getImageDocuments(selectedCategories)
      const response = await askGemini({
        question: text, brainContext, imageDocuments,
        conversationHistory: conversationHistory.current.slice(-6),
        attachedFileText: currentAttach?.isImage ? null : currentAttach?.text,
        attachedFileImage: currentAttach?.isImage ? { base64: currentAttach.base64, mimeType: currentAttach.mimeType } : null,
      })
      const assistantMsg = { id: Date.now() + 1, role: 'assistant', text: response, timestamp: Date.now() }
      setMessages(prev => [...prev, assistantMsg])
      conversationHistory.current.push({ role: 'assistant', text: response })
    } catch (err) {
      let errorText = t.errGeneric(err.message)
      if (err.message === 'API_KEY_MISSING') errorText = t.errApiKey
      else if (err.message.startsWith('INVALID_API_KEY')) errorText = t.errInvalidKey
      else if (err.message === 'RATE_LIMIT') errorText = t.errRateLimit
      else if (err.message.startsWith('INVALID_REQUEST')) errorText = t.errRequest(err.message)

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: errorText, timestamp: Date.now(), isError: true }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const availableCategories = getAvailableCategories()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Messages */}
      <div className="scroll" style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '4px 12px' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--navy-700)', border: '1px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ color: 'var(--accent)', fontSize: 14 }}>AI</span>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px 14px 14px 4px', padding: '12px 16px' }}>
              <div className="loading-dots"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Attached file preview */}
      {attachedFile && (
        <div style={{
          margin: '0 12px 8px', display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px',
        }}>
          <Paperclip size={13} color="var(--accent)" />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }} className="truncate">{attachedFile.name}</span>
          {processingAttach && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Processing...</span>}
          <button onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div style={{ padding: '10px 12px', background: 'var(--navy-900)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ marginBottom: 8 }}>
          <KnowledgeSelector availableCategories={availableCategories} selectedCategories={selectedCategories} onChange={setSelectedCategories} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <input ref={attachInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={handleAttachFile} />
          <button
            onClick={() => attachInputRef.current?.click()}
            disabled={processingAttach}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, width: 40, height: 40, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            <Paperclip size={17} color={attachedFile ? 'var(--accent)' : undefined} />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={documents.length === 0 ? t.inputPlaceholderEmpty : t.inputPlaceholder}
            rows={1}
            style={{
              flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text-primary)', fontFamily: 'inherit',
              fontSize: 11, padding: '10px 14px', outline: 'none', resize: 'none',
              maxHeight: 100, overflowY: 'auto', lineHeight: 1.5,
            }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              background: (!input.trim() || loading) ? 'var(--surface-2)' : 'var(--accent)',
              border: 'none', borderRadius: 10, width: 40, height: 40, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s',
              color: (!input.trim() || loading) ? 'var(--text-muted)' : 'var(--navy-900)',
            }}
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
