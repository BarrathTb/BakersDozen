import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Initialize dark mode from localStorage or default to true (dark mode)
  const isDarkMode = ref(localStorage.getItem('darkMode') !== 'false')

  // Computed property for the current theme name
  const currentTheme = computed(() => (isDarkMode.value ? 'darkTheme' : 'lightTheme'))

  // Watch for changes and update localStorage
  watch(isDarkMode, (newValue) => {
    localStorage.setItem('darkMode', newValue.toString())
    updateTheme()
  })

  // Update the theme in Vuetify
  const updateTheme = () => {
    try {
      document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light')
    } catch (error) {
      console.error('Error updating theme:', error)
    }
  }

  // Toggle between dark and light mode
  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
  }

  // Initialize theme on app start
  const initializeTheme = () => {
    updateTheme()
  }

  return {
    isDarkMode,
    toggleTheme,
    currentTheme,
    initializeTheme,
  }
})
