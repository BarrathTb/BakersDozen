<template>
  <v-app :theme="themeStore.currentTheme" class="app-container">
    <router-view />
    <pwa-install-prompt />
    <app-error-recovery ref="errorRecovery" @recovery-performed="handleRecovery" />
    <auth-recovery ref="authRecovery" @recovery-performed="handleAuthRecovery" />
  </v-app>
</template>

<script lang="ts">
import { defineComponent, onMounted, watch, ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import { detectCacheCorruption } from './utils/cache-recovery'
import PwaInstallPrompt from './components/PwaInstallPrompt.vue'
import AppErrorRecovery from './components/AppErrorRecovery.vue'
import AuthRecovery from './components/AuthRecovery.vue'

export default defineComponent({
  name: 'App',
  components: {
    PwaInstallPrompt, AppErrorRecovery, AuthRecovery
  },

  
  setup() {
    const authStore = useAuthStore()
    const themeStore = useThemeStore()
    
    onMounted(() => {
      // Initialize theme
      themeStore.initializeTheme()
      
      // Initialize auth store
      console.log('App.vue: Initializing auth store')
      authStore.initialize()
        .catch(error => {
          console.error('Error initializing auth store:', error)
          // This might be a good time to show the recovery dialog
          showErrorRecoveryIfNeeded()
        })
      
      // Check for cache corruption
      if (detectCacheCorruption()) {
        console.warn('Cache corruption detected on app mount')
        showErrorRecoveryIfNeeded()
      }
    })
    
    // Reference to the error recovery component
    const errorRecovery = ref<InstanceType<typeof AppErrorRecovery> | null>(null)
    const authRecovery = ref<InstanceType<typeof AuthRecovery> | null>(null)
    
    // Show error recovery dialog if needed
    const showErrorRecoveryIfNeeded = () => {
      if (errorRecovery.value) {
        errorRecovery.value.showRecoveryDialog()
      }
    }
    
    // Show auth recovery dialog if needed
    const showAuthRecoveryIfNeeded = () => {
      if (authRecovery.value) {
        authRecovery.value.showRecoveryDialog()
      }
    }
    
    // Handle recovery performed
    const handleRecovery = () => console.log('Recovery performed')
    
    // Handle auth recovery performed
    const handleAuthRecovery = () => console.log('Auth recovery performed')
    
    // Listen for auth errors
    authStore.$subscribe((_, state) => {
      if (state.error && authRecovery.value) {
        console.log('Auth error detected:', state.error)
        authRecovery.value.registerAuthError(state.error)
      }
    })

    return {
      themeStore, errorRecovery, authRecovery, handleRecovery, handleAuthRecovery
    }
  }
})
</script>

<style>
/* Global styles */
html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.v-application {
  font-family: 'Roboto', sans-serif;
  width: 100%;
  min-height: 100vh;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Dark theme adjustments */
.theme--dark.v-application {
  background-color: #121212;
}

.theme--dark .v-card {
  background-color: #1E1E1E;
}
</style>
