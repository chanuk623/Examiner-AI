import React, { useState, useEffect } from 'react'
import { Shield, Loader, Clock, LogIn } from 'lucide-react'
import { supabase } from '../utils/supabase.js'
import { useLang } from '../i18n.jsx'

// ─── Supabase auth helpers ────────────────────────────────────────────────────

async function checkApproval(email) {
  const { data } = await supabase
    .from('profiles')
    .select('approved, role')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()
  return data
}

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin, // Redirects back to this login page after Google authentication
    },
  })
  return { error }
}

// ─── Main LoginPage ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const { lang, setLang } = useLang()
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [showApprovalNotice, setShowApprovalNotice] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function validateSessionUser(session) {
    if (!session?.user) {
      setShowApprovalNotice(false)
      setCheckingStatus(false)
      return
    }

    const email = session.user.email
    setUserEmail(email)
    
    // Check administrative database approval rules
    const profile = await checkApproval(email)
    
    if (profile && profile.approved) {
      // User is approved -> Send directly to Dashboard!
      window.location.href = '/dashboard' 
      return
    } else {
      // User is authenticated via Google but NOT approved by admin yet
      setShowApprovalNotice(true)
    }
    setCheckingStatus(false)
  }

  useEffect(() => {
    async function init() {
      // Check current session on mount (catches redirection token from Google)
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        await validateSessionUser(data.session)
      } else {
        setCheckingStatus(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session && !showApprovalNotice) {
        setCheckingStatus(true)
        await validateSessionUser(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [showApprovalNotice])

  // Explicit signout happens when they want to clear the locked view
  async function handleDismissNotice() {
    setCheckingStatus(true)
    await supabase.auth.signOut()
    setShowApprovalNotice(false)
    setCheckingStatus(false)
  }

  async function handleGoogleLogin() {
    setErrorMsg('')
    setCheckingStatus(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setErrorMsg(error.message)
      setCheckingStatus(false)
    }
  }

  if (checkingStatus) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-900)' }}>
        <Loader size={24} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // View 1: Awaiting Admin Approval Notification Card
  if (showApprovalNotice) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--navy-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Clock size={40} color="var(--accent)" style={{ margin: '0 auto' }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {lang === 'en' ? 'Google Account Linked!' : 'ගූගල් ගිණුම සම්බන්ධ කරන ලදී!'}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {lang === 'en'
              ? `Hi ${userEmail}, your authentication was successful. However, your account is pending administrator review. You will gain access as soon as your profile is approved.`
              : `ඔබේ ගිණුම සාර්ථකව සම්බන්ධ කර ඇත. පරිපාලක අනුමැතිය ලැබුණු පසු ඔබට පද්ධතියට පිවිසිය හැක.`}
          </p>
          <button 
            onClick={handleDismissNotice} 
            className="btn btn-primary" 
            style={{ marginTop: 8, padding: 10, fontSize: 13 }}
          >
            {lang === 'en' ? 'Back to Login' : 'පිවිසුම් පිටුවට'}
          </button>
        </div>
      </div>
    )
  }

  // View 2: Unified Google Auth Screen (Both Sign In & Registration combined)
  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--navy-900)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
    }}>
      <TopBar lang={lang} setLang={setLang} />

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: 28,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--navy-600), var(--navy-700))',
            border: '1px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Shield size={26} color="var(--accent)" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>ExaminerAI</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', marginTop: 4 }}>
            {lang === 'en' ? 'MOTOR TRAFFIC KNOWLEDGE SYSTEM' : 'මෝටර් රථ දැනුම් පද්ධතිය'}
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: '#2a0a0a', border: '1px solid #3a1010', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--danger)', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: '#ffffff',
            color: '#1f2937',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
        >
          {/* Custom SVG Google Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.281 1.045 15.477 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.854 11.57-11.77 0-.795-.085-1.4-.195-1.945H12.24z"/>
          </svg>
          {lang === 'en' ? 'Continue with Google' : 'ගූගල් ගිණුමෙන් ඉදිරියට යන්න'}
        </button>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
          {lang === 'en'
            ? 'New accounts automatically submit a registration request. Access will be granted following administrator review.'
            : 'නව ගිණුම් ස්වයංක්‍රීයව ලියාපදිංචි කිරීමේ ඉල්ලීමක් ලෙස යොමු කෙරේ. පරිපාලක අනුමැතිය ලැබුණු පසු පිවිසිය හැක.'}
        </p>
      </div>
    </div>
  )
}

// ─── Shared UI blocks ─────────────────────────────────────────────────────────

function TopBar({ lang, setLang }) {
  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'linear-gradient(90deg, #2a1500, #1a0d00)', borderBottom: '2px solid var(--accent)', padding: '7px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.03em' }}>
        ⚠️ DEMO MODE — Do not use real personal data. For concept demonstration only.
      </div>
      <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', gap: 2, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: 3 }}>
        {['en', 'sin'].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{ padding: '3px 10px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s', background: lang === l ? 'var(--accent)' : 'transparent', color: lang === l ? 'var(--navy-900)' : 'var(--text-muted)' }}>
            {l === 'en' ? 'ENG' : 'සිං'}
          </button>
        ))}
      </div>
    </>
  )
}