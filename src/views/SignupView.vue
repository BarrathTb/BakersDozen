<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" flat>
            <v-toolbar-title>Bakers Dozen - Sign Up</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form" v-model="isFormValid" @submit.prevent="signup">
              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Email"
                :prepend-inner-icon="'mdi-email'"
                type="email"
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                :rules="passwordRules"
                label="Password"
                :prepend-inner-icon="'mdi-lock'"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                required
              ></v-text-field>
              <v-text-field
                v-model="confirmPassword"
                :rules="confirmPasswordRules"
                label="Confirm Password"
                :prepend-inner-icon="'mdi-lock-check'"
                :type="showConfirmPassword ? 'text' : 'password'"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
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
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="elevated"
              :loading="authStore.loading"
              :disabled="!isFormValid || authStore.loading"
              @click="signup"
            >
              Sign Up
            </v-btn>
          </v-card-actions>
          <v-card-text class="text-center">
            Already have an account?
            <v-btn variant="text" color="primary" to="/login" size="small">Login</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default defineComponent({
  name: 'SignupView',
  
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const form = ref<any>(null)
    const isFormValid = ref(false)
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    const successMessage = ref('')
    
    const emailRules = [
      (v: string) => !!v || 'Email is required',
      (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid'
    ]
    
    const passwordRules = [
      (v: string) => !!v || 'Password is required',
      (v: string) => v.length >= 6 || 'Password must be at least 6 characters'
    ]
    
    const confirmPasswordRules = [
      (v: string) => !!v || 'Please confirm your password',
      (v: string) => v === password.value || 'Passwords do not match'
    ]
    
    const signup = async () => {
      if (!isFormValid.value) {
        form.value?.validate()
        return
      }
      
      const result = await authStore.signUp(email.value, password.value)
      
      if (result.success) {
        successMessage.value = 'Account created successfully! Please check your email for verification.'
        
        // Reset form
        email.value = ''
        password.value = ''
        confirmPassword.value = ''
        form.value?.reset()
        
        // Redirect to login after a delay
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    }
    
    return {
      authStore,
      form,
      isFormValid,
      email,
      password,
      confirmPassword,
      showPassword,
      showConfirmPassword,
      successMessage,
      emailRules,
      passwordRules,
      confirmPasswordRules,
      signup
    }
  }
})
</script>