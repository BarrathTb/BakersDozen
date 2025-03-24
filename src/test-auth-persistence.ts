/**
 * Authentication Persistence Test Script
 * 
 * This script tests the authentication persistence functionality to ensure
 * that user sessions are correctly maintained across page refreshes and navigation.
 */

import { supabase } from './services/supabase'
import { useAuthStore } from './stores/auth'
import { auth } from './services/auth'

// Test results container
const testResults: {
  name: string;
  success: boolean;
  message: string;
}[] = []

// Helper to log test results
const logTest = (name: string, success: boolean, message: string) => {
  testResults.push({ name, success, message })
  console.log(`Test: ${name} - ${success ? 'PASSED' : 'FAILED'}`)
  console.log(`  ${message}`)
  return success
}

// Test session persistence after initialization
const testInitialSession = async () => {
  try {
    console.log('Testing initial session state...')
    
    // Get current session from Supabase
    const { data: supabaseData } = await supabase.auth.getSession()
    
    // Get session from auth service
    const { data: authData } = await auth.getSession()
    
    // Get user from auth store
    const authStore = useAuthStore()
    const storeUser = authStore.user
    
    // Check if all three sources have consistent session data
    const hasSupabaseSession = !!supabaseData.session
    const hasAuthSession = !!authData.session
    const hasStoreUser = !!storeUser
    
    const isConsistent = 
      (hasSupabaseSession === hasAuthSession && hasAuthSession === hasStoreUser)
    
    return logTest(
      'Initial Session Consistency',
      isConsistent,
      isConsistent 
        ? `Session state is consistent across all sources: ${hasStoreUser ? 'Authenticated' : 'Not authenticated'}`
        : `Session state is inconsistent: Supabase: ${hasSupabaseSession}, Auth Service: ${hasAuthSession}, Auth Store: ${hasStoreUser}`
    )
  } catch (error) {
    return logTest(
      'Initial Session Consistency',
      false,
      `Error testing initial session: ${(error as Error).message}`
    )
  }
}

// Test session persistence after page refresh
const testSessionAfterRefresh = async () => {
  try {
    console.log('Testing session persistence after simulated refresh...')
    
    // Store pre-refresh state
    const { data: beforeData } = await supabase.auth.getSession()
    const hasSessionBefore = !!beforeData.session
    
    // Simulate page refresh by reinitializing auth store
    const authStore = useAuthStore()
    await authStore.initialize()
    
    // Check post-refresh state
    const { data: afterData } = await supabase.auth.getSession()
    const hasSessionAfter = !!afterData.session
    
    // Verify user state in store
    const hasUserAfter = !!authStore.user
    
    const sessionPersisted = hasSessionBefore === hasSessionAfter
    const storeConsistent = hasSessionAfter === hasUserAfter
    
    return logTest(
      'Session Persistence After Refresh',
      sessionPersisted && storeConsistent,
      sessionPersisted && storeConsistent
        ? `Session successfully persisted after refresh: ${hasSessionAfter ? 'Authenticated' : 'Not authenticated'}`
        : `Session persistence failed: Before: ${hasSessionBefore}, After: ${hasSessionAfter}, Store: ${hasUserAfter}`
    )
  } catch (error) {
    return logTest(
      'Session Persistence After Refresh',
      false,
      `Error testing session after refresh: ${(error as Error).message}`
    )
  }
}

// Test token refresh
const testTokenRefresh = async () => {
  try {
    console.log('Testing token refresh...')
    
    // Get current session
    const { data: beforeData } = await supabase.auth.getSession()
    
    if (!beforeData.session) {
      return logTest(
        'Token Refresh',
        false,
        'No session available to test token refresh'
      )
    }
    
    // Store original token
    const originalToken = beforeData.session.access_token
    
    // Attempt to refresh token
    const { data: refreshData, error } = await supabase.auth.refreshSession()
    
    if (error) {
      return logTest(
        'Token Refresh',
        false,
        `Token refresh failed: ${error.message}`
      )
    }
    
    // Check if token was refreshed
    const newToken = refreshData.session?.access_token
    const tokenChanged = originalToken !== newToken
    
    // Verify auth store has updated user
    const authStore = useAuthStore()
    await authStore.initialize() // Reinitialize to ensure it picks up the new token
    const storeHasUser = !!authStore.user
    
    return logTest(
      'Token Refresh',
      tokenChanged && storeHasUser,
      tokenChanged && storeHasUser
        ? 'Token successfully refreshed and auth store updated'
        : `Token refresh issues: Token changed: ${tokenChanged}, Store has user: ${storeHasUser}`
    )
  } catch (error) {
    return logTest(
      'Token Refresh',
      false,
      `Error testing token refresh: ${(error as Error).message}`
    )
  }
}

// Test auth state change listener
const testAuthStateListener = async () => {
  try {
    console.log('Testing auth state change listener...')
    
    // Set up a promise to wait for auth state change
    let listenerCalled = false
    let listenerEvent: string | null = null
    
    const listenerPromise = new Promise<boolean>((resolve) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`Auth state change detected: ${event}`)
        listenerCalled = true
        listenerEvent = event
        subscription.unsubscribe()
        resolve(true)
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        subscription.unsubscribe()
        resolve(false)
      }, 5000)
    })
    
    // Trigger a refresh to cause an auth state change
    await supabase.auth.refreshSession()
    
    // Wait for listener to be called
    const listenerWorked = await listenerPromise
    
    return logTest(
      'Auth State Change Listener',
      listenerWorked,
      listenerWorked
        ? `Auth state change listener successfully detected event: ${listenerEvent}`
        : 'Auth state change listener was not called'
    )
  } catch (error) {
    return logTest(
      'Auth State Change Listener',
      false,
      `Error testing auth state listener: ${(error as Error).message}`
    )
  }
}

// Run all tests
export const runAuthPersistenceTests = async () => {
  console.log('=== AUTHENTICATION PERSISTENCE TESTS ===')
  
  // Clear previous test results
  testResults.length = 0
  
  // Run tests
  await testInitialSession()
  await testSessionAfterRefresh()
  await testTokenRefresh()
  await testAuthStateListener()
  
  // Summarize results
  const totalTests = testResults.length
  const passedTests = testResults.filter(r => r.success).length
  
  console.log('\n=== TEST SUMMARY ===')
  console.log(`Passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`)
  
  // Log failed tests
  const failedTests = testResults.filter(r => !r.success)
  if (failedTests.length > 0) {
    console.log('\nFailed Tests:')
    failedTests.forEach(test => {
      console.log(`- ${test.name}: ${test.message}`)
    })
  }
  
  return {
    success: failedTests.length === 0,
    results: testResults,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests.length
    }
  }
}

// Export test results for external use
export const getTestResults = () => testResults