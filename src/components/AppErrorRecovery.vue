<template>
  <v-dialog v-model="showDialog" persistent max-width="500">
    <v-card>
      <v-card-title class="text-h5 error--text">
        <v-icon left color="error">mdi-alert-circle</v-icon>
        Application Error Detected
      </v-card-title>
      
      <v-card-text>
        <p class="mb-4">
          We've detected an issue that might cause blank or invisible content after page refreshes.
          This is often caused by corrupted browser cache data.
        </p>
        
        <p class="mb-4">
          To fix this issue, we can clear the application's cached data. This won't affect your
          saved information on the server, but you may need to log in again.
        </p>
        
        <v-alert v-if="errorDetails" type="warning" class="mb-4">
          <strong>Error details:</strong> {{ errorDetails }}
        </v-alert>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          text
          @click="dismissDialog"
        >
          Dismiss
        </v-btn>
        <v-btn
          color="error"
          @click="clearCacheAndReload"
          :loading="isClearing"
        >
          Clear Cache & Reload
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  
  <!-- Floating recovery button that appears after errors -->
  <v-btn
    v-if="showRecoveryButton"
    color="error"
    fab
    fixed
    bottom
    right
    class="mb-4 mr-4"
    @click="showDialog = true"
    title="Recover from application errors"
  >
    <v-icon>mdi-refresh</v-icon>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { clearAllCacheData } from '../utils/cache-recovery'

export default defineComponent({
  name: 'AppErrorRecovery',
  
  props: {
    errorDetails: {
      type: String,
      default: ''
    }
  },
  
  setup(props, { emit }) {
    const showDialog = ref(false)
    const showRecoveryButton = ref(false)
    const isClearing = ref(false)
    
    // Check if we've had errors in this session
    onMounted(() => {
      // Check for error count in session storage
      const errorCount = sessionStorage.getItem('app_error_count')
      if (errorCount && parseInt(errorCount) > 0) {
        showRecoveryButton.value = true
      }
      
      // Listen for unhandled errors
      window.addEventListener('error', () => {
        incrementErrorCount()
      })
      
      window.addEventListener('unhandledrejection', () => {
        incrementErrorCount()
      })
    })
    
    // Increment error count in session storage
    const incrementErrorCount = () => {
      const currentCount = sessionStorage.getItem('app_error_count') || '0'
      const newCount = parseInt(currentCount) + 1
      sessionStorage.setItem('app_error_count', newCount.toString())
      
      // Show recovery button after multiple errors
      if (newCount >= 2) {
        showRecoveryButton.value = true
      }
    }
    
    // Clear cache and reload the page
    const clearCacheAndReload = () => {
      isClearing.value = true
      
      try {
        // Clear all application cache
        clearAllCacheData()
        
        // Reset error count
        sessionStorage.setItem('app_error_count', '0')
        
        // Emit event before reload
        emit('recovery-performed')
        
        // Reload the page
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } catch (error) {
        console.error('Error during cache clearing:', error)
        
        // If normal clearing fails, try to force a cache clear via URL parameter
        window.location.href = window.location.pathname + '?clear_cache=true'
      }
    }
    
    // Dismiss the dialog but keep the recovery button visible
    const dismissDialog = () => {
      showDialog.value = false
    }
    
    // Public method to show the recovery dialog
    const showRecoveryDialog = () => {
      showDialog.value = true
    }
    
    return {
      showDialog,
      showRecoveryButton,
      isClearing,
      clearCacheAndReload,
      dismissDialog,
      showRecoveryDialog
    }
  }
})
</script>