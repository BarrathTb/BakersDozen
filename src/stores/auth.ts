import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { auth } from '../services/auth'
import type { User, Session, createClient } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

export const useAuthStore = defineStore('auth', () => {
  // Session token key in localStorage
  const SESSION_TOKEN_KEY = 'supabase.auth.token'

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
      const { data, error: sessionError } = await auth.getSession()
      
      console.log('Auth store initialization - session data:', data.session ? 'Session exists' : 'No session')
      if (sessionError) throw sessionError

      if (data.session?.user) {
        const { data: userData, error: userError } = await auth.getUser()
        if (userError) throw userError
        
        user.value = userData.user
      } else {
        user.value = null
      }
      
      initializationAttempted.value = true
      return true
    } catch (err) {
      console.error('Failed to initialize auth store:', err)
      user.value = null
      initializationAttempted.value = true
      
      // Try to recover by clearing session token
      await recoverFromFailedInit()
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
      const { user: authUser, error: signInError, session } = await auth.signInWithPassword(email, password)

      if (signInError) throw signInError

      if (authUser) {
        user.value = authUser
        // Store session in localStorage for persistence
        if (session) {
          storeSession(session)
        }
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

  // Helper function to store session
  const storeSession = (session: any) => {
    try {
      // Store the session data in localStorage
      localStorage.setItem('auth_user', JSON.stringify(user.value))
      console.log('Session stored successfully')
    } catch (err) {
      console.error('Failed to store session:', err)
    }
  }

  // Helper function to restore session
  const restoreSession = () => {
    try {
      const storedUser = localStorage.getItem('auth_user')
      if (storedUser) {
        user.value = JSON.parse(storedUser)
        return true
      }
    } catch (err) {
      console.error('Failed to restore session:', err)
    }
    return false
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
        // Store session in localStorage for persistence
        if (session) {
          storeSession(session)
        }
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
      // Clear stored session
      localStorage.removeItem('auth_user')
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
    unsubscribe = auth.onAuthStateChange(async (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'TOKEN_REFRESHED', session) => {
      console.log(`Auth state changed: ${event}`, session ? 'Session exists' : 'No session')
      
      if (event === 'SIGNED_IN' && session) {
        const { data, error } = await auth.getUser()
        if (!error && data.user) {
          user.value = data.user
          storeSession(session)
        }
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        localStorage.removeItem('auth_user')
      } else if (event === 'USER_UPDATED' && session) {
        const { data, error } = await auth.getUser()
        if (!error && data.user) {
          user.value = data.user
          storeSession(session)
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Handle token refresh
        storeSession(session)
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
      localStorage.removeItem(SESSION_TOKEN_KEY)
      localStorage.removeItem('supabase.auth.refreshToken')
      localStorage.removeItem('auth_user')
      
      // Try to initialize again
      await initialize()
      console.log('Recovery successful')
    } catch (err) {
      console.error('Recovery failed:', err)
    } finally {
      loading.value = false
    }
  }

  // Watch for loading state changes
  watch(loading, (isLoading) => {
    console.log('Auth store loading state changed:', isLoading)
  })
  
  // Watch for user state changes
  watch(user, (newUser) => {
    if (newUser) {
      console.log('User state updated:', newUser.email)
      storeSession({ user: newUser })
    } else {
      console.log('User state cleared')
      localStorage.removeItem('auth_user')
    }
  })

  // Try to restore session from localStorage on store creation
  restoreSession()
  getSession().then(({ data, error }) => {
    if (error) {
      console.error('Error restoring session:', error)
    } else if (data.session) {
      console.log('Session restored successfully')
      user.value = data.session.user
    }
    else {
      console.log('No session found in localStorage')
    }
    loading.value = false
  }
  )

  
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
    recoverFromFailedInit,
    restoreSession
  }
})
