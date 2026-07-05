import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../utils/supabase.js'
import { getProfile } from '../utils/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadProfile(session.user.id, true) // true = initial load
      } else {
        hasLoadedOnce.current = true // no session, done loading
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        if (hasLoadedOnce.current) {
          // Silent refresh — don't touch loadingProfile
          const p = await getProfile(session.user.id)
          setProfile(p)
        } else {
          await loadProfile(session.user.id, true)
        }
      } else {
        setProfile(null)
        hasLoadedOnce.current = false
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId, isInitial = false) {
    // Only show the loading spinner on the very first load, never mid-session
    if (isInitial) setLoadingProfile(true)
    const p = await getProfile(userId)
    setProfile(p)
    if (isInitial) {
      setLoadingProfile(false)
      hasLoadedOnce.current = true
    }
  }

  async function refreshProfile() {
    if (session) {
      // Explicit refresh (e.g. after OTP) — also silent, no loadingProfile
      const p = await getProfile(session.user.id)
      setProfile(p)
    }
  }

  return (
    <AuthContext.Provider value={{ session, profile, loadingProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}