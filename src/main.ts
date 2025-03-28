import { createApp } from 'vue'
import { setupGlobalCacheRecovery, attemptCacheRecovery } from './utils/cache-recovery'
// Import Supabase client first to ensure it's initialized
import { supabase } from './services/supabase'
import './services/supabase'
// import { testSupabaseConnection } from './test-supabase'
// import { testDataAccess } from './debug-data-access'

import './assets/main.css'

import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'
import { registerSW } from 'virtual:pwa-register'

// Import Supabase client
import './services/database'
import './services/auth'

import App from './App.vue'
import router from './router'

// Verify Supabase session is properly initialized
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state change in main.ts:', event)
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    console.log('Session refreshed in main.ts')
  }
})
// Test Supabase connection
// testSupabaseConnection()
//   .then(success => {
//     console.log('Supabase connection test result:', success ? 'SUCCESS' : 'FAILED')
    
//     // If connection is successful, test data access
//     if (success) {
//       return testDataAccess()
//     }
//   })
//   .catch(err => {
//     console.error('Supabase connection test error:', err)
//   })

// Register service worker (commented out version)
// const updateSW = registerSW({
//   onNeedRefresh() {
//     // Show a prompt to the user to refresh the app
//     console.log('New content available, please refresh.')
//   },
//   onOfflineReady() {
//     // Show a message that the app is ready for offline use
//     console.log('App ready for offline use.')
//   },
// })

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, please refresh.')
    // Optionally show a UI notification to the user
  },
  onOfflineReady() {
    console.log('App ready for offline use.')
    // Optionally show a UI notification to the user
  },
})

// Add a global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error)
})

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

// Set up cache recovery mechanism
setupGlobalCacheRecovery()

// Attempt cache recovery on startup
const needsRecovery = attemptCacheRecovery()
if (needsRecovery) {
  console.log('Cache corruption detected and recovery attempted')
  // Optionally show a notification to the user
  // that the app has recovered from a corrupted state
}

// Create and configure the app with error handling
console.log('Initializing application...')

// Create and configure the app
const app = createApp(App)
const pinia = createPinia()


// Add error handler for Vue errors
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error handler:', err, info)
}

app.use(pinia)
app.use(router)
app.use(vuetify)
app.mount('#app')
