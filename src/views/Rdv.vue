<script setup>
import { ref } from 'vue'
import { store, retour, toast } from '../store.js'
import { CRENEAUX } from '../data.js'
import { haptic } from '../telegram.js'

const choix = ref(null)
const sujet = ref('')
const fait = ref(false)

function confirmer () {
  haptic('success')
  fait.value = true
  toast('Rendez-vous confirmé · rappel la veille par le bot')
}
</script>

<template>
  <div class="page">
    <template v-if="!fait">
      <div class="card small muted">Fini les numéros de téléphone épinglés : choisissez un créneau libre, l'analyste reçoit votre question à l'avance.</div>
      <div class="section-title">Créneaux disponibles</div>
      <div class="card flat">
        <button v-for="c in CRENEAUX" :key="c" class="list-item" @click="choix = c">
          <span class="icon">🗓️</span><span class="grow strong">{{ c }}</span><span style="font-size:20px">{{ choix === c ? '🔘' : '⚪' }}</span>
        </button>
      </div>
      <div class="card field">
        <label for="sujet">Votre question (l'analyste la lit avant)</label>
        <textarea id="sujet" v-model="sujet" placeholder="Ex. : je vise la rente, comment répartir mes prochains achats ?"></textarea>
      </div>
      <button class="btn" :disabled="!choix" @click="confirmer">Confirmer le rendez-vous</button>
    </template>
    <div v-else class="card" style="text-align:center;padding:26px 16px">
      <div style="font-size:40px">✅</div>
      <div class="big">C'est réservé</div>
      <div class="muted">{{ choix }} · analyste EDB</div>
      <p class="small muted">Après l'échange, vous pourrez noter la séance : la direction suit ainsi la qualité du coaching.</p>
      <button class="btn secondary" @click="retour">Retour</button>
    </div>
  </div>
</template>
