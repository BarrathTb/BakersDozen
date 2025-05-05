<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-img :src="logo" alt="app logo" class="app-logo"></v-img>
          <div class="daily-quote">
            <p>"{{ randomQuote.text }}"</p>
            <p class="quote-author">— {{ randomQuote.author }}</p>
          </div>
          <v-toolbar color="primary" flat>
            <v-toolbar-title>Dough Tracker - Login</v-toolbar-title>
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
              <v-alert v-if="authStore.error" type="error" class="mt-3" dismissible>
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
            <v-btn variant="text" color="primary" to="/forgot-password" size="small"
              >Forgot Password?</v-btn
            >
            <div class="mt-3">
              Don't have an account?
              <v-btn variant="text" color="primary" to="/signup" size="small">Sign Up</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="8" md="6" lg="4">
        <div class="text-center">
          <v-img :src="randomLoginImage" alt="Dough Tracker Login Image" class="login-image" />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import doughTrackerLogin01 from '../assets/images/login/dough-tracker-login-01.png'
import doughTrackerLogin02 from '../assets/images/login/dough-tracker-login-02.png'
import doughTrackerLogin03 from '../assets/images/login/dough-tracker-login-03.png'
import doughTrackerLogin04 from '../assets/images/login/dough-tracker-login-04.png'
import doughTrackerLogin05 from '../assets/images/login/dough-tracker-login-05.png'
import doughTrackerLogin06 from '../assets/images/login/dough-tracker-login-06.png'
import doughTrackerLogin07 from '../assets/images/login/dough-tracker-login-07.png'
import doughTrackerLogin08 from '../assets/images/login/dough-tracker-login-08.png'
import doughTrackerLogin09 from '../assets/images/login/dough-tracker-login-09.png'
import doughTrackerLogin10 from '../assets/images/login/dough-tracker-login-10.webp'
import { useAuthStore } from '../stores/auth'

import appLogo from '../assets/images/logos/dough-tracker-logo.png'
export default defineComponent({
  name: 'LoginView',

  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const loginImages = [
      doughTrackerLogin01,
      doughTrackerLogin02,
      doughTrackerLogin03,
      doughTrackerLogin04,
      doughTrackerLogin05,
      doughTrackerLogin06,
      doughTrackerLogin07,
      doughTrackerLogin08,
      doughTrackerLogin09,
      doughTrackerLogin10,
    ]
    const randomLoginImage = ref(loginImages[Math.floor(Math.random() * loginImages.length)])
    const form = ref<HTMLFormElement | null>(null)
    const logo = appLogo
    const isFormValid = ref(false)
    const email = ref('')
    const password = ref('')
    const showPassword = ref(false)

    // Add quotes array
    const quotes = [
      { text: 'Baking is love made visible.', author: 'Anonymous' },
      { text: 'Life is what you bake it.', author: 'Anonymous' },
      { text: 'A balanced diet is a cookie in each hand.', author: 'Barbara Johnson' },
      { text: 'Happiness is the smell of freshly baked bread.', author: 'Anonymous' },
      {
        text: "You can't buy happiness, but you can bake a cake, and that's kind of the same thing.",
        author: 'Anonymous',
      },
      { text: 'Good things come to those who bake.', author: 'Anonymous' },
      { text: 'Baking is cheaper than therapy.', author: 'Anonymous' },
      { text: 'Keep calm and bake on.', author: 'Anonymous' },
      { text: 'Stressed spelled backwards is desserts.', author: 'Anonymous' },
      { text: 'Count the memories, not the calories.', author: 'Anonymous' },
    ]

    // Function to get a random quote that changes daily
    const getDailyQuote = () => {
      // Use the current date as a seed for consistent daily quotes
      const today = new Date()
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
      const index = seed % quotes.length
      return quotes[index]
    }

    const dailyQuote = ref(getDailyQuote())
    const randomQuote = ref(quotes[Math.floor(Math.random() * quotes.length)])

    const emailRules = [
      (v: string) => !!v || 'Email is required',
      (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid',
    ]

    const passwordRules = [
      (v: string) => !!v || 'Password is required',
      (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
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
      randomLoginImage,
      logo,
      dailyQuote,
      randomQuote,
      login,
    }
  },
})
</script>

<style scoped>
.login-image {
  width: 100%;
  height: auto;
  max-height: 650px;
  /* object-fit: cover; */
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .login-image {
    max-height: 300px;
  }
}

.app-logo {
  height: 150px;
  width: auto;
  margin: 15px auto;
}

.daily-quote {
  font-size: 1rem;
  text-align: center;
  margin: 15px 15px;
  font-style: italic;
}

@media (max-width: 599px) {
  .login-image {
    height: 150px;
  }
}
</style>
