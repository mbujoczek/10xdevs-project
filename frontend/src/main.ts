import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import i18n from './i18n'
import { Toast, options as toastOptions } from './plugins/toast'
import vuetify from './plugins/vuetify'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(vuetify)
app.use(Toast, toastOptions)

app.mount('#app')
