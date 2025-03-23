// Test file to verify Supabase connection
import { supabase } from './services/supabase'

// Function to test Supabase connection
export async function testSupabaseConnection() {
  console.log('Testing Supabase connection...')
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('Supabase Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
  
  try {
    // Test a simple query
    const { data, error } = await supabase.from('users').select('id').limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    
    console.log('Supabase connection successful:', data)
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
}

// Run the test if this file is executed directly
if (import.meta.url.endsWith('test-supabase.ts')) {
  testSupabaseConnection()
    .then(success => {
      console.log('Connection test result:', success ? 'SUCCESS' : 'FAILED')
    })
    .catch(err => {
      console.error('Connection test error:', err)
    })
}