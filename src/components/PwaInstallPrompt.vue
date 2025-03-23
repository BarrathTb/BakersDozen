<template>
  <v-snackbar
    v-model="showInstallPrompt"
    :timeout="10000"
    color="primary"
    location="bottom"
  >
    <div class="d-flex align-center">
      <span>Install Bakers Dozen for offline use</span>
      <v-spacer></v-spacer>
      <v-btn
        variant="text"
        @click="installPwa"
      >
        Install
      </v-btn>
      <v-btn
        variant="text"
        @click="closePrompt"
      >
        Dismiss
      </v-btn>
    </div>
  </v-snackbar>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'

export default defineComponent({
  name: 'PwaInstallPrompt',
  
  setup() {
    const showInstallPrompt = ref(false)
    const deferredPrompt = ref<any>(null)
    
    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      
      // Stash the event so it can be triggered later
      deferredPrompt.value = e
      
      // Show the install prompt
      showInstallPrompt.value = true
    }
    
    // Install PWA
    const installPwa = async () => {
      if (!deferredPrompt.value) {
        return
      }
      
      // Show the install prompt
      deferredPrompt.value.prompt()
      
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.value.userChoice
      
      // Reset the deferred prompt variable
      deferredPrompt.value = null
      
      // Hide the install prompt
      showInstallPrompt.value = false
      
      // Log the result
      console.log('User choice:', choiceResult.outcome)
    }
    
    // Close the prompt
    const closePrompt = () => {
      showInstallPrompt.value = false
    }
    
    // Add event listener when component is mounted
    onMounted(() => {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    })
    
    // Remove event listener when component is unmounted
    onUnmounted(() => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    })
    
    return {
      showInstallPrompt,
      installPwa,
      closePrompt
    }
  }
})
</script>