import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        colors: {
          primary: '#3A9D5D',
          secondary: '#35495e',
          accent: '#FFC107',
          error: '#f44336',
          warning: '#ff9800',
          info: '#2196f3',
          success: '#3A9D5D',
        },
      },
      dark: {
        colors: {
          primary: '#3A9D5D',
          secondary: '#35495e',
          accent: '#FFC107',
          error: '#f44336',
          warning: '#ff9800',
          info: '#2196f3',
          success: '#3A9D5D',
        },
      },
    },
  },
})

export default vuetify
