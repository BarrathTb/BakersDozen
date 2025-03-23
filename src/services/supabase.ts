import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Connection status monitoring
let isOffline = false

// Check connection status
export const checkConnection = async (): Promise<boolean> => {
  try {
    // Simple query to check if we can connect to Supabase
    const { data, error } = await supabase.from('users').select('id').limit(1)
    
    if (error) throw error
    
    isOffline = false
    return true
  } catch (error) {
    isOffline = true
    console.error('Supabase connection error:', error)
    return false
  }
}

// Get connection status
export const getConnectionStatus = (): boolean => {
  return !isOffline
}

// Initialize connection monitoring
export const initConnectionMonitoring = () => {
  // Check connection initially
  checkConnection()
  
  // Set up periodic connection checks
  setInterval(checkConnection, 30000) // Check every 30 seconds
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    checkConnection()
  })
  
  window.addEventListener('offline', () => {
    isOffline = true
  })
}

// Initialize connection monitoring
initConnectionMonitoring()