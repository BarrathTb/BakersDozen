<template>
  <v-dialog v-model="showDialog" persistent max-width="500">
    <v-card>
      <v-card-title class="text-h5 warning--text">
        <v-icon left color="warning">mdi-account-alert</v-icon>
        Authentication Issue Detected
      </v-card-title>
      
      <v-card-text>
        <p class="mb-4">
          We've detected an issue with your authentication session. This might cause problems
          with accessing protected areas of the application or result in a blank screen after refresh.
        </p>
        
        <p class="mb-4">
          This is often caused by an expired or invalid session token. We'll attempt to fix this
          automatically, or you can sign out and sign back in.
        </p>
        
        <v-alert v-if="errorDetails" type="warning" class="mb-4">
          <strong>Error details:</strong> {{ errorDetails }}
        </v-alert>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="success"
          @click="attemptAutoRecovery"
          :loading="isRecovering"
        >
          Auto-Recover
        </v-btn>
        <v-btn
          color="primary"
          text
          @click="dismissDialog"
        >
          Dismiss
        </v-btn>
        <v-btn
          color="warning"
          @click="clearSessionAndReload"
          :loading="isClearing"
        >
          Sign Out & Reload
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  
  <!-- Floating recovery button that appears after auth errors -->
  <v-btn
    v-if="showRecoveryButton"
    color="warning"
    fab
    fixed
    bottom
    right
    class="mb-16 mr-4"
    @click="showDialog = true"
    title="Recover from authentication issues"
  >
    <v-icon>mdi-account-reactivate</v-icon>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabase'

export default defineComponent({
  name: 'AuthRecovery',
  
  props: {
    errorDetails: {
      type: String,
      default: ''
    }
  },
  
  setup(props, { emit }) {
    const showDialog = ref(false)
    const showRecoveryButton = ref(false)
    const isRecovering = ref(false)
    const isClearing = ref(false)
    const authStore = useAuthStore()
    const router = useRouter()
    
    // Check if we've had auth errors in this session
    onMounted(() => {
      // Check for error count in session storage
      const authErrorCount = sessionStorage.getItem('auth_error_count')
      if (authErrorCount && parseInt(authErrorCount) > 0) {
        showRecoveryButton.value = true
      }
    })
    
    // Increment auth error count in session storage
    const incrementAuthErrorCount = () => {
      const currentCount = sessionStorage.getItem('auth_error_count') || '0'
      const newCount = parseInt(currentCount) + 1
      sessionStorage.setItem('auth_error_count', newCount.toString())
      
      // Show recovery button after multiple errors
      if (newCount >= 2) {
        showRecoveryButton.value = true
      }
    }
    
    // Attempt automatic recovery without signing out
    const attemptAutoRecovery = async () => {
      isRecovering.value = true
      
      try {
        console.log('Attempting automatic session recovery...')
        
        // First try to refresh the session
        const { data, error } = await supabase.auth.refreshSession()
        
        if (error) throw error
        
        if (data.session) {
          // Re-initialize auth store with the refreshed session
          await authStore.initialize()
          showDialog.value = false
          showRecoveryButton.value = false
          sessionStorage.setItem('auth_error_count', '0')
          emit('recovery-performed')
          console.log('Automatic recovery successful')
        }
      } catch (error) {
        console.error('Automatic recovery failed:', error)
      } finally {
        isRecovering.value = false
      }
    }
    
    // Clear session and reload the page
    const clearSessionAndReload = async () => {
      isClearing.value = true
      
      try {
        // Sign out using the auth store
        await authStore.signOut()
        
        // Reset error count
        sessionStorage.setItem('auth_error_count', '0')
        
        // Emit event before reload
        emit('recovery-performed')
        
        // Redirect to login page
        router.push({ name: 'login' })
      } catch (error) {
        console.error('Error during auth recovery:', error)
        
        // If normal clearing fails, try to force a sign out via localStorage
        await supabase.auth.signOut({ scope: 'local' })
        
        // Reload the page
        window.location.href = '/login?clear_auth=true'
      } finally {
        isClearing.value = false
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
    
    // Public method to register an auth error
    const registerAuthError = (error: any) => {
      incrementAuthErrorCount()
      
      // Show the recovery button after the first error
      showRecoveryButton.value = true
      
      // Show the dialog immediately for serious errors
      if (error && (
        error.message?.includes('JWT') || 
        error.message?.includes('token') || 
        error.message?.includes('session') ||
        error.message?.includes('auth')
      )) {
        showDialog.value = true
      }
    }
    
    return {
      showDialog,
      showRecoveryButton,
        isRecovering,
      isClearing,
      clearSessionAndReload,
      attemptAutoRecovery,
      dismissDialog,
      showRecoveryDialog,
      registerAuthError
    }
  }
})
</script>