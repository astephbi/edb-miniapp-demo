import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { initTelegram } from './telegram.js'
import { initReel, store } from './store.js'

initTelegram()
// Lien direct vers la page d'accueil des nouveaux (bouton « Ce que j'ai manqué » du bot)
if (location.hash === '#bienvenue') store.vue = 'parcours'
createApp(App).mount('#app')
initReel()
