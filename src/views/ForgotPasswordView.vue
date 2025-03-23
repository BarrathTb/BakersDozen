<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" flat>
            <v-toolbar-title>Bakers Dozen - Reset Password</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form" v-model="isFormValid" @submit.prevent="resetPassword">
              <p class="mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Email"
                :prepend-inner-icon="'mdi-email'"
                type="email"
                required
              ></v-text-field>
              <v-alert
                v-if="authStore.error"
                type="error"
                class="mt-3"
                dismissible
              >
                {{ authStore.error }}
              </v-alert>
              <v-alert
                v-if="successMessage"
                type="success"
                class="mt-3"
                dismissible
              >
                {{ successMessage }}
              </v-alert>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" to="/login">
              Back to Login
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="elevated"
              :loading="authStore.loading"
              :disabled="!isFormValid || authStore.loading"
              @click="resetPassword"
            >
              Reset Password
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useAuthStore } from '../stores/auth'

export default defineComponent({
  name: 'ForgotPasswordView',
  
  setup() {
    const authStore = useAuthStore()
    
    const form = ref<any>(null)
    const isFormValid = ref(false)
    const email = ref('')
    const successMessage = ref('')
    
    const emailRules = [
      (v: string) => !!v || 'Email is required',
      (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid'
    ]
    
    const resetPassword = async () => {
      if (!isFormValid.value) {
        form.value?.validate()
        return
      }
      
      const result = await authStore.resetPassword(email.value)
      
      if (result.success) {
        successMessage.value = 'Password reset instructions have been sent to your email.'
        
        // Reset form
        email.value = ''
        form.value?.reset()
      }
    }
    
    return {
      authStore,
      form,
      isFormValid,
      email,
      successMessage,
      emailRules,
      resetPassword
    }
  }
})
</script>