

// Import Supabase client first to ensure it's initialized
import './services/supabase'
// import { testSupabaseConnection } from './test-supabase'
// import { testDataAccess } from './debug-data-access'

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'
import { registerSW } from 'virtual:pwa-register'

// Import Supabase client
import './services/supabase'

// Import database and auth services
import './services/database'
import './services/auth'

import App from './App.vue'
import router from './router'


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

// // Register service worker
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
  },
  onOfflineReady() {
    console.log('App ready for offline use.')
  },
})
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
