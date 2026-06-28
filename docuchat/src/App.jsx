import React, { useState, useEffect } from 'react'
import DemoBanner from './components/DemoBanner.jsx'
import DocumentList from './components/DocumentList.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import FileUploader from './components/FileUploader.jsx'
import StorageBanner from './components/StorageBanner.jsx'
import LoginPage from './pages/LoginPage.jsx'
import AdminDashboard from './components/AdminDashboard.jsx' // 👈 Your new admin dashboard component
import { processFile } from './utils/fileProcessor.js'
import { addDocumentToBrain, removeDocumentFromBrain } from './utils/brainManager.js'
import { uploadDocument, loadUserDocuments, deleteDocument, downloadFileBuffer, getStorageUsage } from './utils/storage.js'
import { signOut, verifyOtp } from './utils/auth.js' 
import { parsePdf } from './utils/pdfParser.js'
import { parseExcel } from './utils/excelParser.js'
import { parseWord } from './utils/wordParser.js'
import { useAuth } from './context/AuthContext.jsx'
import { useLang } from './i18n.jsx'
import { Upload, Shield, Loader, LogOut, User, Clock } from 'lucide-react'

export default function App() {
  const { session, profile, loadingProfile, refreshProfile } = useAuth()
  const { t } = useLang()
  const [documents, setDocuments] = useState([])
  const [showUploader, setShowUploader] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [toast, setToast] = useState(null)
  const [storageUsed, setStorageUsed] = useState(0)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [verifyingToken, setVerifyingToken] = useState(false) 

  // Global custom toast trigger inside App wrapper
  function triggerLocalToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // Intercept email verification parameters on initial mount
  useEffect(() => {
    async function checkEmailVerification() {
      const urlParams = new URLSearchParams(window.location.search)
      const token_hash = urlParams.get('token_hash')
      const type = urlParams.get('type')

      if (token_hash && type) {
        setVerifyingToken(true)
        console.log('Detecting email token... Exchanging credentials.')
        
        const { error } = await verifyOtp(token_hash, type)
        
        if (error) {
          console.error('OTP Verification failed:', error.message)
          triggerLocalToast(`⚠️ ${error.message}`)
        } else {
          console.log('OTP verification successful!')
          if (refreshProfile) await refreshProfile()
        }
        
        // Scrub the URL hashes out of the address bar safely
        window.history.replaceState({}, document.title, window.location.pathname)
        setVerifyingToken(false)
      }
    }

    checkEmailVerification()
  }, [refreshProfile])

  // Global Loader state across handshakes
  if (session === undefined || loadingProfile || verifyingToken) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-900)' }}>
        <Loader size={24} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ─── ROUTING MATRIX ────────────────────────────────────────────────────────

  // Route 1: No active server token session -> Send to AuthScreen
  if (!session) {
    return <LoginPage />
  }

  // Route 2: Account is authenticated and explicitly flagged as an admin -> Send to Admin Command Gateway
  if (profile?.role === 'admin') {
    return <AdminDashboard />
  }

  // Route 3: Account is authenticated, but database 'approved' flag is missing or false
  if (profile && !profile.approved) {
    return <PendingApprovalScreen profile={profile} />
  }

  // Route 4: Regular consumer client pass-through -> Show Operational Playground
  return (
    <MainApp
      session={session}
      profile={profile}
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
      t={t}
      refreshProfile={refreshProfile}
    />
  )
}

// ─── Child Components Restructured Below ──────────────────────────────────────

function PendingApprovalScreen({ profile }) {
  const { lang } = useLang()
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-900)', padding: 24, gap: 20 }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Clock size={26} color="var(--accent)" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          {lang === 'en' ? 'Awaiting Approval' : 'අනුමැතිය බලාපොරොත්තුවෙන්'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 320 }}>
          {lang === 'en'
            ? `Your account (${profile?.email}) is pending administrator approval. You will gain system access as soon as an admin approves your profile.`
            : `ඔබේ ගිණුම (${profile?.email}) පරිපාලක අනුමැතිය බලාපොරොත්තු වේ.`}
        </div>
      </div>
      <button className="btn btn-ghost" onClick={() => signOut()}>
        <LogOut size={14} />
        {lang === 'en' ? 'Sign Out' : 'පිටවන්න'}
      </button>
    </div>
  )
}

function MainApp({ session, profile, documents, setDocuments, showUploader, setShowUploader, processing, setProcessing, processingStatus, setProcessingStatus, toast, setToast, storageUsed, setStorageUsed, loadingDocs, setLoadingDocs, t, refreshProfile }) {
  const { lang, setLang } = useLang()

  function showToast(msg, duration = 2500) {
    setToast(msg)
    setTimeout(() => setToast(null), duration)
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
          console.error('Failed to reload doc:', doc.name, err)
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
      setProcessingStatus(`${t.processing} ${i + 1}/${files.length}: ${file.name}`)
      try {
        const processed = await processFile(file)
        const doc = await uploadDocument(file, session.user.id, category, processed.text)
        const entry = { id: doc.id, name: file.name, category, type: processed.type, size: file.size, isImage: processed.isImage, base64: processed.base64, mimeType: file.type, text: processed.text, storage_path: doc.storage_path }
        addDocumentToBrain(entry)
        results.push(entry)
      } catch (err) {
        console.error('Upload failed:', file.name, err)
        showToast(t.toastFailed(file.name))
      }
    }
    setDocuments(prev => [...prev, ...results])
    setProcessing(false)
    setProcessingStatus('')
    if (results.length > 0) {
      showToast(t.toastAdded(results.length))
      loadStorageUsage()
    }
  }

  async function handleRemoveDocument(id) {
    const doc = documents.find(d => d.id === id)
    if (!doc) return
    try {
      await deleteDocument(id, doc.storage_path, session.user.id, doc.size)
      removeDocumentFromBrain(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
      showToast(t.toastRemoved)
      loadStorageUsage()
    } catch (err) {
      showToast('⚠️ Failed to delete document')
    }
  }

  function handleCategoryChange(id, newCategory) {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, category: newCategory } : d))
    const doc = documents.find(d => d.id === id)
    if (doc) addDocumentToBrain({ ...doc, category: newCategory })
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--navy-800)', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <DemoBanner />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--navy-900)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, var(--navy-600), var(--navy-700))', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={17} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>ExaminerAI</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>{t.headerSubtitle}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: 3 }}>
            {['en', 'sin'].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: '3px 8px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: lang === l ? 'var(--accent)' : 'transparent', color: lang === l ? 'var(--navy-900)' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                {l === 'en' ? 'ENG' : 'සිං'}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowUploader(true)} style={{ gap: 5 }}>
            <Upload size={13} />{t.uploadBtn}
          </button>
          <button onClick={signOut} title="Sign out" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* User info bar */}
      <div style={{ padding: '5px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <User size={11} color="var(--text-muted)" />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{profile?.email}</span>
        {profile?.role === 'admin' && <span className="badge badge-amber" style={{ fontSize: 10 }}>Admin</span>}
      </div>

      {/* Storage banner */}
      <StorageBanner usedBytes={storageUsed} />

      {/* Processing bar */}
      {(processing || loadingDocs) && (
        <div style={{ padding: '8px 14px', background: 'var(--surface-3)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Loader size={13} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {loadingDocs ? (lang === 'en' ? 'Loading your documents...' : 'ලේඛන පූරණය වෙමින්...') : processingStatus}
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <DocumentList documents={documents} onRemove={handleRemoveDocument} onCategoryChange={handleCategoryChange} />
      <ChatWindow documents={documents} />

      {showUploader && <FileUploader onUpload={handleUpload} onClose={() => setShowUploader(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}