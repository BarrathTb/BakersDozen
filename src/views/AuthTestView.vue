<template>
  <div class="auth-test-view">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h4">
              Authentication System Test
            </v-card-title>
            
            <v-card-text>
              <p class="mb-4">
                This page allows you to test the authentication persistence functionality of the application.
                You can verify that user sessions are correctly maintained across page refreshes and navigation.
              </p>
              
              <v-alert type="info" class="mb-4">
                <strong>Current Authentication Status:</strong> 
                {{ isLoggedIn ? 'Authenticated as ' + userEmail : 'Not authenticated' }}
              </v-alert>
              
              <v-row>
                <v-col cols="12" md="6">
                  <v-card outlined>
                    <v-card-title>Session Tests</v-card-title>
                    <v-card-text>
                      <v-btn 
                        color="primary" 
                        block 
                        class="mb-2"
                        @click="showTestDialog = true"
                      >
                        Run Automated Tests
                      </v-btn>
                      
                      <v-btn 
                        color="secondary" 
                        block 
                        class="mb-2"
                        @click="refreshPage"
                      >
                        Simulate Page Refresh
                      </v-btn>
                      
                      <v-btn 
                        color="info" 
                        block
                        @click="checkSession"
                        :loading="isChecking"
                      >
                        Check Current Session
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-card outlined>
                    <v-card-title>Authentication Actions</v-card-title>
                    <v-card-text>
                      <template v-if="isLoggedIn">
                        <v-btn 
                          color="error" 
                          block 
                          class="mb-2"
                          @click="signOut"
                          :loading="isSigningOut"
                        >
                          Sign Out
                        </v-btn>
                        
                        <v-btn 
                          color="warning" 
                          block
                          @click="refreshToken"
                          :loading="isRefreshing"
                        >
                          Refresh Token
                        </v-btn>
                      </template>
                      
                      <template v-else>
                        <v-btn 
                          color="success" 
                          block
                          @click="navigateToLogin"
                        >
                          Go to Login
                        </v-btn>
                      </template>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              
              <v-card outlined class="mt-4" v-if="sessionInfo">
                <v-card-title>Session Information</v-card-title>
                <v-card-text>
                  <pre class="session-info">{{ sessionInfo }}</pre>
                </v-card-text>
              </v-card>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- Test Dialog -->
    <v-dialog v-model="showTestDialog" max-width="800">
      <auth-persistence-test @close="showTestDialog = false" />
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../services/supabase'
import AuthPersistenceTest from '../components/AuthPersistenceTest.vue'

export default defineComponent({
  name: 'AuthTestView',
  
  components: {
    AuthPersistenceTest
  },
  
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const showTestDialog = ref(false)
    const isChecking = ref(false)
    const isSigningOut = ref(false)
    const isRefreshing = ref(false)
    const sessionInfo = ref('')
    
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const userEmail = computed(() => authStore.user?.email || '')
    
    // Check current session
    const checkSession = async () => {
      isChecking.value = true
      
      try {
        // Get session from Supabase
        const { data, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        // Format session info for display
        if (data.session) {
          const { access_token, refresh_token, ...sessionData } = data.session
          
          sessionInfo.value = JSON.stringify({
            ...sessionData,
            access_token: access_token ? `${access_token.substring(0, 10)}...` : null,
            refresh_token: refresh_token ? `${refresh_token.substring(0, 10)}...` : null,
            user: {
              ...data.session.user,
              id: data.session.user.id.substring(0, 10) + '...',
            }
          }, null, 2)
        } else {
          sessionInfo.value = 'No active session found'
        }
      } catch (error) {
        console.error('Error checking session:', error)
        sessionInfo.value = `Error: ${(error as Error).message}`
      } finally {
        isChecking.value = false
      }
    }
    
    // Refresh token
    const refreshToken = async () => {
      isRefreshing.value = true
      
      try {
        const { data, error } = await supabase.auth.refreshSession()
        
        if (error) throw error
        
        if (data.session) {
          await authStore.initialize()
          sessionInfo.value = 'Token refreshed successfully'
        } else {
          sessionInfo.value = 'Failed to refresh token - no session returned'
        }
      } catch (error) {
        console.error('Error refreshing token:', error)
        sessionInfo.value = `Error refreshing token: ${(error as Error).message}`
      } finally {
        isRefreshing.value = false
      }
    }
    
    // Sign out
    const signOut = async () => {
      isSigningOut.value = true
      
      try {
        await authStore.signOut()
        sessionInfo.value = 'Signed out successfully'
        
        // Redirect to login page
        router.push({ name: 'login' })
      } catch (error) {
        console.error('Error signing out:', error)
        sessionInfo.value = `Error signing out: ${(error as Error).message}`
      } finally {
        isSigningOut.value = false
      }
    }
    
    // Navigate to login
    const navigateToLogin = () => {
      router.push({ name: 'login' })
    }
    
    // Simulate page refresh
    const refreshPage = () => {
      window.location.reload()
    }
    
    // Check session on mount
    onMounted(() => {
      checkSession()
    })
    
    return {
      showTestDialog,
      isChecking,
      isSigningOut,
      isRefreshing,
      sessionInfo,
      isLoggedIn,
      userEmail,
      checkSession,
      refreshToken,
      signOut,
      navigateToLogin,
      refreshPage
    }
  }
})
</script>

<style scoped>
.auth-test-view {
  padding: 20px 0;
}

.session-info {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
  white-space: pre-wrap;
}
</style>