import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '../services/auth'
import type { User } from '../types/supabase'
import type { Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isLoggedIn = computed(() => !!user.value)

  // Initialize the store with the current user
  const initialize = async () => {
    loading.value = true
    try {
      const { data, error: sessionError } = await auth.getSession()
      if (sessionError) throw sessionError

      if (data.session?.user) {
        const { data: userData, error: userError } = await auth.getUser()
        if (userError) throw userError
        
        user.value = userData.user
      } else {
        user.value = null
      }
    } catch (err) {
      console.error('Failed to initialize auth store:', err)
      user.value = null
    } finally {
      loading.value = false
    }
  }

  // Sign in
  const signIn = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      const { user: authUser, error: signInError } = await auth.signInWithPassword(email, password)

      if (signInError) throw signInError

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
      const { user: authUser, error: signUpError } = await auth.signUp(email, password)

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
    unsubscribe = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data, error } = await auth.getUser()
        if (!error && data.user) {
          user.value = data.user
        }
      } else if (event === 'SIGNED_OUT') {
        user.value = null
      } else if (event === 'USER_UPDATED' && session) {
        const { data, error } = await auth.getUser()
        if (!error && data.user) {
          user.value = data.user
        }
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
    cleanupAuthListener
  }
})
