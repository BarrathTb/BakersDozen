<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" flat>
            <v-toolbar-title>Bakers Dozen - Login</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form" v-model="isFormValid" @submit.prevent="login">
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
              <v-alert
                v-if="authStore.error"
                type="error"
                class="mt-3"
                dismissible
              >
                {{ authStore.error }}
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
              @click="login"
            >
              Login
            </v-btn>
          </v-card-actions>
          <v-card-text class="text-center">
            <v-btn variant="text" color="primary" to="/forgot-password" size="small">Forgot Password?</v-btn>
            <div class="mt-3">
              Don't have an account?
              <v-btn variant="text" color="primary" to="/signup" size="small">Sign Up</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default defineComponent({
  name: 'LoginView',
  
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const form = ref<any>(null)
    const isFormValid = ref(false)
    const email = ref('')
    const password = ref('')
    const showPassword = ref(false)
    
    const emailRules = [
      (v: string) => !!v || 'Email is required',
      (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid'
    ]
    
    const passwordRules = [
      (v: string) => !!v || 'Password is required',
      (v: string) => v.length >= 6 || 'Password must be at least 6 characters'
    ]
    
    const login = async () => {
      if (!isFormValid.value) {
        form.value?.validate()
        return
      }
      
      const result = await authStore.signIn(email.value, password.value)
      
      if (result.success) {
        router.push('/')
      }
    }
    
    return {
      authStore,
      form,
      isFormValid,
      email,
      password,
      showPassword,
      emailRules,
      passwordRules,
      login
    }
  }
})
</script>