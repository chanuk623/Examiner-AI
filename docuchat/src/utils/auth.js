import { supabase } from './supabase.js'

/**
 * Verifies the email token hash sent from the Edge Function hook.
 * @param {string} token_hash - The secure hashed token from the email link query param.
 * @param {string} type - The email action type (e.g., 'signup', 'magiclink', 'recovery').
 */
export async function verifyOtp(token_hash, type) {
  // Guard check: Ensure the named export actually loaded the client
  if (!supabase || !supabase.auth) {
    console.error("Supabase client is not initialized yet.")
    return { data: null, error: new Error("Client initialization pending or missing API keys.") }
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type, // 'signup', 'magiclink', etc.
  })
  
  return { data, error }
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function approveUser(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ approved: true, updated_at: new Date().toISOString() })
    .eq('id', userId)
  return { error }
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}