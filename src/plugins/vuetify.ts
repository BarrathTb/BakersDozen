// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import type { ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Create themes for Bakers Dozen
const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    primary: '#2196F3',
    // primary-two: '#00A86B',
    // primary-three: '#2196F3',
    secondary: '#4ECDC4',
    accent: '#F7FFF7',
    error: '#FF5252',
    info: '#00C07F',
    success: '#4CAF50',
    warning: '#FFC107',
    background: '#121212',
    surface: '#1E1E1E',
  },
}

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary: '#00A86B',
    secondary: '#4ECDC4',
    accent: '#1A535C',
    error: '#FF5252',
    info: '#00C07F',
    success: '#4CAF50',
    warning: '#FFC107',
    background: '#F7FFF7',
    surface: '#FFFFFF',
  },
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'darkTheme', // Default to dark theme
    themes: {
      darkTheme,
      lightTheme,
    },
  },
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  defaults: {
    VCard: {
      rounded: 'md',
      elevation: 2,
    },
    VBtn: {
      rounded: 'md',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VDataTable: {
      fixedHeader: true,
      hover: true,
    },
  },
})
