import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { auth } from '../services/auth'
import type { User, Session, createClient } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const initializationAttempted = ref(false)
  const isLoggedIn = computed(() => !!user.value)

  // Initialize the store with the current user from Supabase
  const initialize = async () => {
  loading.value = true
  console.log('Initializing auth store...')
  
  try {
    // First check if there's a session in Supabase
    const { data, error: sessionError } = await supabase.auth.getSession()
    
    console.log('Auth store initialization - session data:', data.session ? 
      `Session exists for ${data.session.user.email}` : 'No session')
    
    if (sessionError) throw sessionError

    if (data.session?.user) {
      // If we have a session, get the user data
      user.value = {
        id: data.session.user.id,
        email: data.session.user.email || '',
        role: data.session.user.user_metadata?.role || 'user',
        created_at: data.session.user.created_at || new Date().toISOString(),
        app_metadata: data.session.user.app_metadata || {},
        user_metadata: data.session.user.user_metadata || {},
        aud: data.session.user.aud || ''
      }
      console.log('User data loaded from session:', user.value.email)
    } else {
      user.value = null
    }
    
    initializationAttempted.value = true
    return true
  } catch (err) {
    console.error('Failed to initialize auth store:', err)
    user.value = null
    initializationAttempted.value = true
    return false
  } finally {
    loading.value = false
    console.log('Auth store initialization complete')
  }
}


  const getSession = async () => {
    const { data, error } = await auth.getSession()
    return { data: { session: data.session }, error }
  }

  // Sign in
  const signIn = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      const { data: { user: authUser, session }, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) throw signInError
      
await supabase.auth.getSession();
if
 (session) {
    
console
.log(
'User is authenticated:'
, session.user);
} 
else
 {
    
console
.log(
'No active session'
);
}
      if (authUser) {
        user.value = authUser

        return { success: true }
      } else {
        return { success: false, message: 'Failed to sign in' }
      }
    } catch (err) {
      error.value = (err as Error).message
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // Sign up
  const signUp = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      const { user: authUser, error: signUpError, session } = await auth.signUp(email, password)

      if (signUpError) throw signUpError

      if (authUser) {
        user.value = authUser
        return { success: true }
      } else {
        return { success: false, message: 'Failed to sign up' }
      }
    } catch (err) {
      error.value = (err as Error).message
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // Sign out
  const signOut = async () => {
    loading.value = true
    error.value = null

    try {
      const { error: signOutError } = await auth.signOut()

      if (signOutError) throw signOutError

      user.value = null
      return { success: true }
    } catch (err) {
      error.value = (err as Error).message
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    loading.value = true
    error.value = null

    try {
      const { error: resetError } = await auth.resetPassword(email)

      if (resetError) throw resetError

      return { success: true }
    } catch (err) {
      error.value = (err as Error).message
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // Update password
  const updatePassword = async (password: string) => {
    loading.value = true
    error.value = null

    try {
      const { error: updateError } = await auth.updateUser({
        password
      })

      if (updateError) throw updateError

      return { success: true }
    } catch (err) {
      error.value = (err as Error).message
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // Set up auth state change listener
  let unsubscribe: (() => void) | null = null

  const setupAuthListener = () => {
  console.log('Setting up auth state change listener')
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
  unsubscribe = () => subscription.unsubscribe();
    console.log(`Auth state changed: ${event}`, session ? 
      `Session exists for ${session.user.email}` : 'No session')
    
    if (event === 'SIGNED_IN' && session) {
      user.value = session.user
    } else if (event === 'SIGNED_OUT') {
      user.value = null
    } else if (event === 'USER_UPDATED' && session) {
      user.value = session.user
    } else if (event === 'TOKEN_REFRESHED' && session) {
      user.value = session.user
      console.log('Token refreshed successfully')
    }
  })
}


  // Clean up auth listener
  const cleanupAuthListener = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // Add a recovery mechanism for failed initialization
  const recoverFromFailedInit = async () => {
    console.log('Attempting to recover from failed initialization...')
    try {
      // Clear any potentially corrupted auth state
      // Let Supabase handle its own session storage
      await supabase.auth.signOut({ scope: 'local' })
      user.value = null
      
      // Try to initialize again
      const result = await getSession()
      if (result.data.session) {
        const { data, error } = await auth.getUser()
        if (!error && data?.user) {
          user.value = data.user
          console.log('Recovery successful')
          return true
        }
      }
      return false
    } catch (err) {
      console.error('Recovery failed:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Initialize auth listener
  setupAuthListener()

  return {
    user,
    loading,
    error,
    isAdmin,
    isLoggedIn,
    initialize,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    cleanupAuthListener,
    initializationAttempted,
    recoverFromFailedInit
  }
})
