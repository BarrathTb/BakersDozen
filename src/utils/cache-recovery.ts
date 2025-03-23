/**
 * Cache Recovery Utilities
 * 
 * This module provides utilities for managing and recovering from cache-related issues
 * that might cause blank pages after browser refreshes.
 */

// Constants
const CACHE_PREFIX = 'bakersDozen_'
const AUTH_CACHE_KEYS = ['supabase.auth.token', 'supabase.auth.refreshToken']

/**
 * Clears all application cache data
 * This can be used to recover from corrupted cache states
 */
export const clearAllCacheData = (): void => {
  console.log('Clearing all application cache data...')
  
  // Get all localStorage keys
  const keys = Object.keys(localStorage)
  
  // Filter keys related to our application
  const appKeys = keys.filter(key => 
    key.startsWith(CACHE_PREFIX) || 
    key.startsWith('supabase.auth')
  )
  
  // Remove all application-related keys
  appKeys.forEach(key => {
    console.log(`Removing cache key: ${key}`)
    localStorage.removeItem(key)
  })
  
  console.log(`Cleared ${appKeys.length} cache items`)
}

/**
 * Clears only authentication-related cache data
 * This can be used to recover from authentication issues
 */
export const clearAuthCache = (): void => {
  console.log('Clearing authentication cache data...')
  
  AUTH_CACHE_KEYS.forEach(key => {
    console.log(`Removing auth cache key: ${key}`)
    localStorage.removeItem(key)
  })
  
  console.log('Authentication cache cleared')
}

/**
 * Checks if the cache is potentially corrupted
 * @returns boolean indicating if cache corruption is detected
 */
export const detectCacheCorruption = (): boolean => {
  try {
    // Check for auth token
    const authToken = localStorage.getItem('supabase.auth.token')
    
    // If we have an auth token, try to parse it
    if (authToken) {
      try {
        JSON.parse(authToken)
      } catch (e) {
        console.error('Corrupted auth token detected')
        return true
      }
    }
    
    // Check for corrupted data in our application cache
    const keys = Object.keys(localStorage)
    const appKeys = keys.filter(key => key.startsWith(CACHE_PREFIX))
    
    for (const key of appKeys) {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          JSON.parse(value)
        }
      } catch (e) {
        console.error(`Corrupted cache detected for key: ${key}`)
        return true
      }
    }
    
    return false
  } catch (e) {
    console.error('Error checking cache corruption:', e)
    return true
  }
}

/**
 * Attempts to recover from cache issues
 * @returns boolean indicating if recovery was successful
 */
export const attemptCacheRecovery = (): boolean => {
  try {
    if (detectCacheCorruption()) {
      clearAllCacheData()
      return true
    }
    return false
  } catch (e) {
    console.error('Error during cache recovery attempt:', e)
    // If recovery fails, clear everything as a last resort
    try {
      clearAllCacheData()
    } catch (clearError) {
      console.error('Failed to clear cache during recovery:', clearError)
    }
    return false
  }
}

/**
 * Adds a global cache recovery mechanism to the window
 * This can be triggered manually if needed
 */
export const setupGlobalCacheRecovery = (): void => {
  // Add to window for debugging/manual recovery
  (window as any).__bakersDozenCacheRecovery = {
    clearAllCacheData,
    clearAuthCache,
    detectCacheCorruption,
    attemptCacheRecovery
  }
  
  // Add automatic recovery on page load
  window.addEventListener('load', () => {
    // Check for URL parameter that indicates we should clear cache
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('clear_cache')) {
      console.log('Clear cache parameter detected, clearing all cache data')
      clearAllCacheData()
      
      // Remove the parameter from the URL
      urlParams.delete('clear_cache')
      const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '')
      window.history.replaceState({}, document.title, newUrl)
    }
  })
}

export default {
  clearAllCacheData,
  clearAuthCache,
  detectCacheCorruption,
  attemptCacheRecovery,
  setupGlobalCacheRecovery
}