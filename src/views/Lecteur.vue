<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { store, aller, mmss } from '../store.js'
import { CONTENUS, TYPES } from '../data.js'
import { haptic } from '../telegram.js'

const c = computed(() => CONTENUS.find(x => x.id === store.lecture.id) || CONTENUS[0])
const segs = computed(() => c.value.transcript)
const i = ref(Math.min(store.lecture.segment || 0, segs.value.length - 1))
const lecture = ref(false)
const vitesse = ref(1)
const total = computed(() => segs.value[segs.value.length - 1].t + 60)
const pct = computed(() => Math.round(segs.value[i.value].t / total.value * 100))

// Démo : la « voix » est la synthèse vocale du téléphone qui lit la transcription.
// En production : vrai fichier audio + transcription horodatée (Whisper).
const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
let jeton = 0
let minuteur = null

function voixFr () {
  const v = synth ? synth.getVoices() : []
  return v.find(x => /fr[-_](CI|FR)/i.test(x.lang)) || v.find(x => /^fr/i.test(x.lang)) || null
}

function lire (k) {
  const mon = ++jeton
  clearTimeout(minuteur)
  if (synth) synth.cancel()
  const suivant = () => {
    if (mon !== jeton || !lecture.value) return
    if (k + 1 < segs.value.length) { i.value = k + 1; lire(k + 1) } else { lecture.value = false }
  }
  const voix = voixFr()
  if (synth && voix) {
    const u = new SpeechSynthesisUtterance(segs.value[k].txt)
    u.voice = voix; u.lang = voix.lang; u.rate = vitesse.value
    u.onend = suivant
    u.onerror = () => { if (mon === jeton) minuteur = setTimeout(suivant, 3500 / vitesse.value) }
    synth.speak(u)
  } else {
    minuteur = setTimeout(suivant, (2000 + segs.value[k].txt.length * 35) / vitesse.value)
  }
}

function basculer () {
  haptic('light')
  lecture.value = !lecture.value
  if (lecture.value) lire(i.value)
  else { jeton++; clearTimeout(minuteur); if (synth) synth.cancel() }
}
function aller_a (k) {
  i.value = Math.max(0, Math.min(segs.value.length - 1, k))
  if (lecture.value) lire(i.value)
}
function changerVitesse () {
  const v = [1, 1.25, 1.5, 2]
  vitesse.value = v[(v.indexOf(vitesse.value) + 1) % v.length]
  if (lecture.value) lire(i.value)
}

watch(i, k => {
  store.moi.reprise = { [c.value.id]: k }
  nextTick(() => {
    const el = document.getElementById('seg-' + k)
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
})
onUnmounted(() => { jeton++; clearTimeout(minuteur); if (synth) synth.cancel() })
</script>

<template>
  <div class="page">
    <div class="card" style="text-align:center;padding:20px 16px 16px">
      <div style="font-size:40px">{{ TYPES[c.type].icone }}</div>
      <div class="strong" style="font-size:17px;margin-top:6px">{{ c.titre }}</div>
      <div class="muted small">{{ c.coach }} · {{ new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}</div>
      <div v-if="c.societes.length" class="chips" style="justify-content:center;margin-top:10px;flex-wrap:wrap">
        <span v-for="s in c.societes" :key="s" class="pill grey">{{ s }}</span>
      </div>

      <div class="progress" style="margin:18px 0 6px"><div :style="{ width: pct + '%' }"></div></div>
      <div class="row muted small" style="justify-content:space-between"><span>{{ mmss(segs[i].t) }}</span><span>{{ c.duree }}</span></div>

      <div class="row" style="justify-content:center;gap:22px;margin-top:10px">
        <button @click="aller_a(i - 1)" aria-label="Passage précédent" style="font-size:24px">⏮</button>
        <button @click="basculer" :aria-label="lecture ? 'Pause' : 'Lecture'"
          style="width:62px;height:62px;border-radius:50%;background:var(--accent);color:var(--accent-text);font-size:24px">{{ lecture ? '❚❚' : '▶' }}</button>
        <button @click="aller_a(i + 1)" aria-label="Passage suivant" style="font-size:24px">⏭</button>
      </div>
      <div class="row" style="justify-content:center;gap:8px;margin-top:12px">
        <button class="btn sm secondary" @click="changerVitesse">Vitesse ×{{ vitesse }}</button>
        <button class="btn sm secondary" @click="aller('assistant')">💬 Poser une question</button>
      </div>
      <div class="muted small" style="margin-top:10px">Voix de synthèse pour la démo · la position est mémorisée</div>
    </div>

    <div class="section-title">Transcription · touchez un passage pour y aller</div>
    <div class="card flat">
      <button v-for="(s, k) in segs" :key="k" :id="'seg-' + k" class="list-item" style="align-items:flex-start"
        :style="k === i ? 'background:var(--accent-soft)' : ''" @click="aller_a(k)">
        <span class="pill" :class="k === i ? '' : 'grey'" style="flex:none">{{ mmss(s.t) }}</span>
        <span class="small" :style="k === i ? 'font-weight:600' : ''">{{ s.txt }}</span>
      </button>
    </div>
  </div>
</template>
