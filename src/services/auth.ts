// Authentication service using Supabase
import { supabase } from './supabase'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import type { User } from '../types/supabase'

// Define auth response type
export interface AuthResponse {
  user: User | null
  session: Session | null
  error: Error | null
}

// Authentication service
export const auth = {
  // Get current session
  async getSession(): Promise<{ data: { session: Session | null }, error: Error | null }> {
    const { data, error } = await supabase.auth.getSession()
    console.log("Current Session:", data.session)
    return { data: { session: data.session }, error }
  },
  
  // Get current user with profile data
  async getUser(): Promise<{ data: { user: User | null }, error: Error | null }> {
    const { data: { user }, error } = await supabase.auth.getUser()
    console.log("Current User:", user)
    if (error || !user) {
      return { data: { user: null }, error }
    }
    
    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      // If the profile doesn't exist yet, return a default user
      if (profileError.code === 'PGRST116') {
        return {
          data: {
            user: {
              id: user.id,
              email: user.email || '',
              role: 'user',
              created_at: user.created_at || new Date().toISOString()
            }
          },
          error: null
        }
      }
      
      return { data: { user: null }, error: profileError }
    }
    
    return {
      data: {
        user: {
          id: user.id,
          email: user.email || '',
          role: profile?.role || 'user',
          created_at: user.created_at || new Date().toISOString()
        }
      },
      error: null
    }
  },
  
  // Sign in with email and password
  async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error || !data.user) {
      return { user: null, session: null, error }
    }
    
    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') {
      return { user: null, session: null, error: profileError }
    }
    console.log("User session Profile:",profile)
    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        role: profile?.role || 'user',
        created_at: data.user.created_at || new Date().toISOString()
      },
      session: data.session,
      error: null
    }
  },
  
  // Sign up with email and password
  async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      // First, sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user'
          }
        }
      })
      
      if (error || !data.user) {
        return { user: null, session: null, error }
      }
      
      // Try to create the user profile, but don't fail if it doesn't work due to RLS
      try {
        await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || '',
            role: 'user',
            created_at: new Date().toISOString()
          })
      } catch (profileError) {
        console.warn('Could not create user profile due to RLS policy. This is expected.', profileError)
        // Continue anyway since the auth user was created
      }
      
      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          role: 'user',
          created_at: data.user.created_at || new Date().toISOString()
        },
        session: data.session,
        error: null
      }
    } catch (err) {
      console.error('Error in signup process:', err)
      return { user: null, session: null, error: err as Error }
    }
  },
  
  // Sign out
  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut()
    return { error }
  },
  
  // Reset password
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { error }
  },
  
  // Update user
  async updateUser(updates: { password?: string }): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.updateUser(updates)
    return { error }
  },
  
  // Check if user is admin
  async isAdmin(): Promise<boolean> {
    const { data } = await this.getUser()
    console.log(" User Is Admin:",data.user)
    return data.user ? data.user.role === 'admin' : false
  },
  
  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    const { data } = await this.getUser()
    console.log(" User Is logged in:", data.user)
    return data.user !== null
  },
  
  // Set up auth state change listener
  onAuthStateChange(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED', session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      // If a user just signed in, try to create their profile
      if (event === 'SIGNED_IN' && session) {
        try {
          const { error } = await supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email || '',
              role: session.user.user_metadata?.role || 'user',
              created_at: new Date().toISOString()
            })
          
          if (error) {
            console.warn('Could not create/update user profile on sign in:', error)
          }
        } catch (err) {
          console.warn('Error creating/updating user profile on sign in:', err)
        }
      }
      
      callback(event as any, session)
    })
    
    // Return unsubscribe function
    return data.subscription.unsubscribe
  }
}