import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { initTelegram } from './telegram.js'

initTelegram()
createApp(App).mount('#app')
