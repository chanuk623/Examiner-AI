import React, { useState, useEffect } from 'react'
import { Users, MessageSquare, ShieldCheck, Check, AlertCircle, Loader, LogOut, Search, ArrowLeft } from 'lucide-react'
import { supabase } from '../utils/supabase.js'
import { useLang } from '../i18n.jsx'

// We import the child components directly from App.tsx logic to reuse them
import DocumentList from './DocumentList.jsx'
import ChatWindow from './ChatWindow.jsx'
import FileUploader from './FileUploader.jsx'
import StorageBanner from './StorageBanner.jsx'
import DemoBanner from './DemoBanner.jsx'
import { processFile } from '../utils/fileProcessor.js'
import { addDocumentToBrain, removeDocumentFromBrain } from '../utils/brainManager.js'
import { uploadDocument, loadUserDocuments, deleteDocument, downloadFileBuffer, getStorageUsage } from '../utils/storage.js'
import { signOut } from '../utils/auth.js'
import { parsePdf } from '../utils/pdfParser.js'
import { parseExcel } from '../utils/excelParser.js'
import { parseWord } from '../utils/wordParser.js'

export default function AdminDashboard() {
  const { lang } = useLang()
  const [currentView, setCurrentView] = useState('gateway') // 'gateway' | 'bot' | 'users'
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionStatus, setActionStatus] = useState({ type: '', message: '' })
  
  // State required to run the normal user's MainApp interface for the admin session
  const [adminSession, setAdminSession] = useState(null)
  const [adminProfile, setAdminProfile] = useState(null)
  const [documents, setDocuments] = useState([])
  const [showUploader, setShowUploader] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [toast, setToast] = useState(null)
  const [storageUsed, setStorageUsed] = useState(0)
  const [loadingDocs, setLoadingDocs] = useState(false)

  // Grab admin credentials on mount to pass down to the chat engine
  useEffect(() => {
    async function getAdminSessionDetails() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setAdminSession(session)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        setAdminProfile(profile)
      }
    }
    getAdminSessionDetails()
  }, [])

  // Fetch profiles for the User Management section
  async function fetchProfiles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, approved, role, created_at')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProfiles(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (currentView === 'users') {
      fetchProfiles()
    }
  }, [currentView])

  async function handleApproveUser(userId) {
    setActionStatus({ type: '', message: '' })
    const { error } = await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('id', userId)

    if (error) {
      setActionStatus({ type: 'error', message: error.message })
    } else {
      setActionStatus({ type: 'success', message: 'User approved successfully!' })
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, approved: true } : p))
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const filteredProfiles = profiles.filter(p => 
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ─── VIEW 1: LANDING GATEWAY ROUTER ─────────────────────────────────────────
  if (currentView === 'gateway') {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--navy-900)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--navy-600), var(--navy-700))', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldCheck size={32} color="var(--accent)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>Admin Command Gateway</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Select a system module to initialize administrative session</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, width: '100%', maxWidth: 640 }}>
          {/* Card 1: AI Chat Bot */}
          <div 
            onClick={() => setCurrentView('bot')}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, transition: 'transform 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={24} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>AI Chat Bot</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>Access the operational system playground environment and chat configurations.</p>
            </div>
          </div>

          {/* Card 2: User Management */}
          <div 
            onClick={() => setCurrentView('users')}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, transition: 'transform 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>User Management</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>Review incoming account registration logs, audit access, and toggle approval grants.</p>
            </div>
          </div>
        </div>

        <button onClick={handleLogout} style={{ marginTop: 40, background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <LogOut size={14} /> System Logout
        </button>
      </div>
    )
  }

  // ─── VIEW 2: FULL ACCESS USER CHAT CONSOLE (INJECTED MAIN APP) ──────────────
  if (currentView === 'bot') {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--navy-900)' }}>
        {/* Admin Switcher Bar */}
        <div style={{ background: '#7c2d12', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ffedd5', fontSize: 13, fontWeight: 600 }}>
            <ShieldCheck size={16} color="var(--accent)" />
            Viewing Mode: User Chat Playground (Admin Privileges Active)
          </div>
          <button 
            onClick={() => setCurrentView('gateway')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--navy-900)', border: '1px solid var(--accent)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <ArrowLeft size={14} /> Back to Admin Gateway
          </button>
        </div>

        {/* Embedded Regular User Chat Layout */}
        {adminSession ? (
          <AdminEmbeddedChatWrapper
            session={adminSession}
            profile={adminProfile}
            documents={documents}
            setDocuments={setDocuments}
            showUploader={showUploader}
            setShowUploader={setShowUploader}
            processing={processing}
            setProcessing={setProcessing}
            processingStatus={processingStatus}
            setProcessingStatus={setProcessingStatus}
            toast={toast}
            setToast={setToast}
            storageUsed={storageUsed}
            setStorageUsed={setStorageUsed}
            loadingDocs={loadingDocs}
            setLoadingDocs={setLoadingDocs}
          />
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading authentication context...</div>
        )}
      </div>
    )
  }

  // ─── VIEW 3: USER MANAGEMENT & APPROVAL PANEL ──────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--navy-900)', padding: 32 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users color="#3b82f6" />
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>User Management Dashboard</h1>
          </div>
          <button onClick={() => setCurrentView('gateway')} className="btn" style={{ padding: '8px 16px', fontSize: 12 }}>
            ← Return to Gateway
          </button>
        </div>

        {actionStatus.message && (
          <div style={{ background: actionStatus.type === 'success' ? '#0a2a1a' : '#2a0a0a', border: `1px solid ${actionStatus.type === 'success' ? '#0f3a20' : '#3a1010'}`, borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: actionStatus.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {actionStatus.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {actionStatus.message}
          </div>
        )}

        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search registrations by email address..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 42px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14 }}
          />
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Loader size={24} color="var(--accent)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No registered profiles found matching your scope.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Email Address</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.email}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      <span style={{ fontSize: 11, background: 'var(--navy-600)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: user.approved ? 'var(--success)' : 'var(--accent)' }}>
                        {user.approved ? '● Approved Access' : '● Awaiting Grant'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      {user.approved ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Check size={14} color="var(--success)" /> Active Account
                        </span>
                      ) : (
                        <button onClick={() => handleApproveUser(user.id)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12, borderRadius: 6 }}>
                          Approve Profile
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── REUSED NORMAL USER CHAT COMPONENT ENGINE ─────────────────────────────────

function AdminEmbeddedChatWrapper({ session, profile, documents, setDocuments, showUploader, setShowUploader, processing, setProcessing, processingStatus, setProcessingStatus, toast, setToast, storageUsed, setStorageUsed, loadingDocs, setLoadingDocs }) {
  const { lang, setLang } = useLang()

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    loadDocumentsFromSupabase()
    loadStorageUsage()
  }, [])

  async function loadStorageUsage() {
    const used = await getStorageUsage(session.user.id)
    setStorageUsed(used)
  }

  async function loadDocumentsFromSupabase() {
    setLoadingDocs(true)
    try {
      const docs = await loadUserDocuments(session.user.id)
      const processed = []
      for (const doc of docs) {
        try {
          let text = ''
          let base64 = null
          const blob = await downloadFileBuffer(doc.storage_path)
          if (doc.is_image) {
            const reader = new FileReader()
            base64 = await new Promise(res => {
              reader.onload = () => res(reader.result.split(',')[1])
              reader.readAsDataURL(blob)
            })
          } else {
            const file = new File([blob], doc.name, { type: doc.mime_type })
            if (doc.file_type === 'pdf') text = await parsePdf(file)
            else if (doc.file_type === 'excel') text = await parseExcel(file)
            else if (doc.file_type === 'word') text = await parseWord(file)
          }
          const entry = { id: doc.id, name: doc.name, category: doc.category, type: doc.file_type, size: doc.size_bytes, isImage: doc.is_image, base64, mimeType: doc.mime_type, text, storage_path: doc.storage_path }
          addDocumentToBrain(entry)
          processed.push(entry)
        } catch (err) {
          console.error(err)
        }
      }
      setDocuments(processed)
    } catch (err) {
      showToast('⚠️ Failed to load documents')
    } finally {
      setLoadingDocs(false)
    }
  }

  async function handleUpload(files, category) {
    setProcessing(true)
    const results = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProcessingStatus(`Processing ${i + 1}/${files.length}: ${file.name}`)
      try {
        const processed = await processFile(file)
        const doc = await uploadDocument(file, session.user.id, category, processed.text)
        const entry = { id: doc.id, name: file.name, category, type: processed.type, size: file.size, isImage: processed.isImage, base64: processed.base64, mimeType: file.type, text: processed.text, storage_path: doc.storage_path }
        addDocumentToBrain(entry)
        results.push(entry)
      } catch (err) {
        showToast('⚠️ Upload error')
      }
    }
    setDocuments(prev => [...prev, ...results])
    setProcessing(false)
    setProcessingStatus('')
    if (results.length > 0) loadStorageUsage()
  }

  async function handleRemoveDocument(id) {
    const doc = documents.find(d => d.id === id)
    if (!doc) return
    try {
      await deleteDocument(id, doc.storage_path, session.user.id, doc.size)
      removeDocumentFromBrain(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
      loadStorageUsage()
    } catch (err) {
      showToast('⚠️ Delete failed')
    }
  }

  function handleCategoryChange(id, newCategory) {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, category: newCategory } : d))
    const doc = documents.find(d => d.id === id)
    if (doc) addDocumentToBrain({ ...doc, category: newCategory })
  }

  return (
    <div style={{ height: 'calc(100dvh - 45px)', display: 'flex', flexDirection: 'column', background: 'var(--navy-800)', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <DemoBanner />
      
      {/* App Header Component inside Admin Wrapper */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--navy-900)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, var(--navy-600), var(--navy-700))', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={17} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>ExaminerAI</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Admin Playground Session</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowUploader(true)}>Upload</button>
        </div>
      </div>

      <StorageBanner usedBytes={storageUsed} />

      {(processing || loadingDocs) && (
        <div style={{ padding: '8px 14px', background: 'var(--surface-3)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader size={13} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{loadingDocs ? 'Syncing workspace...' : processingStatus}</span>
        </div>
      )}

      <DocumentList documents={documents} onRemove={handleRemoveDocument} onCategoryChange={handleCategoryChange} />
      <ChatWindow documents={documents} />

      {showUploader && <FileUploader onUpload={handleUpload} onClose={() => setShowUploader(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}