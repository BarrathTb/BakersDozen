// Vuetify
import '@mdi/font/css/materialdesignicons.css'
import type { ThemeDefinition } from 'vuetify'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'

// Create themes for Dough Dozen
const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    primary: '#F5C87F',
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

const vuetify = createVuetify({
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

export default vuetify
