<script setup>
import { computed, watch } from 'vue'
import { store, aller, retour } from './store.js'
import { setBackButton, insideTelegram, haptic } from './telegram.js'
import Accueil from './views/Accueil.vue'
import Abonnement from './views/Abonnement.vue'
import Bibliotheque from './views/Bibliotheque.vue'
import Lecteur from './views/Lecteur.vue'
import Parcours from './views/Parcours.vue'
import Assistant from './views/Assistant.vue'
import Rdv from './views/Rdv.vue'
import Admin from './views/Admin.vue'
import Coach from './views/Coach.vue'

const VUES = {
  accueil: { c: Accueil, titre: 'EDB Assistance', tab: 'accueil' },
  bibliotheque: { c: Bibliotheque, titre: 'Bibliothèque', tab: 'bibliotheque' },
  lecteur: { c: Lecteur, titre: 'Lecture', tab: 'bibliotheque' },
  assistant: { c: Assistant, titre: 'Assistant EDB', tab: 'assistant' },
  rdv: { c: Rdv, titre: 'Réserver un analyste', tab: 'assistant' },
  abonnement: { c: Abonnement, titre: 'Mon abonnement', tab: 'compte' },
  parcours: { c: Parcours, titre: 'Bienvenue', tab: 'accueil' },
  admin: { c: Admin, titre: 'Espace Brice', tab: null },
  coach: { c: Coach, titre: 'Espace coach', tab: null }
}
const courant = computed(() => VUES[store.vue] || VUES.accueil)
const racines = ['accueil', 'bibliotheque', 'assistant', 'abonnement', 'admin', 'coach']
const peutRevenir = computed(() => !racines.includes(store.vue))

watch(peutRevenir, v => setBackButton(v, retour), { immediate: true })

function onglet (v) {
  haptic('light')
  store.historique = []
  store.vue = v
  window.scrollTo(0, 0)
}
function role (r) {
  haptic('medium')
  store.role = r
  store.toast = null
  store.historique = []
  store.vue = r === 'admin' ? 'admin' : r === 'coach' ? 'coach' : 'accueil'
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <button v-if="peutRevenir && !insideTelegram" class="back" @click="retour" aria-label="Retour">‹</button>
      <h1>{{ courant.titre }}</h1>
      <div class="switch" role="tablist" aria-label="Vue de démonstration">
        <button :class="{ on: store.role === 'membre' }" @click="role('membre')">Membre</button>
        <button :class="{ on: store.role === 'coach' }" @click="role('coach')">Coach</button>
        <button :class="{ on: store.role === 'admin' }" @click="role('admin')">Brice</button>
      </div>
    </header>
    <p class="demo-ribbon">{{ store.reel ? 'Connecté au bot · paiements en mode test' : 'Démo · données fictives · paiements simulés' }}</p>

    <component :is="courant.c" :key="store.vue" />

    <nav v-if="store.role === 'membre'" class="tabbar">
      <button :class="{ on: courant.tab === 'accueil' }" @click="onglet('accueil')"><span>🏠</span><span>Accueil</span></button>
      <button :class="{ on: courant.tab === 'bibliotheque' }" @click="onglet('bibliotheque')"><span>📚</span><span>Bibliothèque</span></button>
      <button :class="{ on: courant.tab === 'assistant' }" @click="onglet('assistant')"><span>💬</span><span>Assistant</span></button>
      <button :class="{ on: courant.tab === 'compte' }" @click="onglet('abonnement')"><span>💳</span><span>Abonnement</span></button>
    </nav>

    <div v-if="store.toast" class="toast" role="status">{{ store.toast }}</div>
  </div>
</template>
