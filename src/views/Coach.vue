<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { store, toast } from '../store.js'
import { NIVEAUX, CONTENUS } from '../data.js'
import { haptic } from '../telegram.js'

const onglet = ref('file')
const enAttente = computed(() => store.questions.filter(q => q.statut === 'attente'))
const repondues = computed(() => store.questions.filter(q => q.statut === 'repondu'))
const ouverte = ref(null)
const texte = ref('')
const pourFaq = ref(false)
const vocal = ref(null) // { duree } une fois enregistré
const enreg = ref(false)
const secondes = ref(0)
let chrono = null

const niv = id => NIVEAUX.find(n => n.id === id) || NIVEAUX[0]

function ouvrir (q) {
  haptic('light')
  ouverte.value = ouverte.value === q.id ? null : q.id
  texte.value = ''; vocal.value = null; pourFaq.value = false; arreterChrono()
}

// Démo : l'enregistrement est simulé. En production, le coach enregistre un vrai vocal
// (micro du téléphone) que le bot envoie au membre comme message vocal Telegram.
function basculerVocal () {
  haptic('medium')
  if (!enreg.value) {
    enreg.value = true; secondes.value = 0; vocal.value = null
    chrono = setInterval(() => { secondes.value++ }, 1000)
  } else {
    arreterChrono()
    vocal.value = { duree: Math.max(secondes.value, 3) }
  }
}
function arreterChrono () { enreg.value = false; clearInterval(chrono) }
onUnmounted(arreterChrono)

function envoyer (q) {
  if (!texte.value.trim() && !vocal.value) return
  haptic('success')
  q.statut = 'repondu'
  q.reponse = { texte: texte.value.trim(), vocal: vocal.value, coach: 'Analyste n°1', faq: pourFaq.value }
  if (q.moi) store.reponses.unshift({ question: q.texte, ...q.reponse })
  toast('Réponse envoyée en privé à ' + q.membre + (pourFaq.value ? ' · ajoutée à la FAQ à valider' : ''))
  ouverte.value = null
}

const RDV = ref([
  { id: 'r1', heure: '10h00', membre: 'Clarisse O.', sujet: 'Je vise la rente : comment répartir mes 3 prochains achats ?', lien: false },
  { id: 'r2', heure: '14h30', membre: 'Moussa L.', sujet: 'Faut-il garder une valeur qui a baissé de 20 % depuis mon achat ?', lien: false }
])
function lien (r) { haptic('light'); r.lien = true; toast('Lien d\'appel vidéo envoyé à ' + r.membre + ' et à vous') }

const devoirMembre = ref('Koffi K.')
const devoirTache = ref('c1')
const devoirs = ref([{ membre: 'Fatou N.', tache: 'Spécial diaspora : alimenter son compte', fait: true }])
function assigner () {
  haptic('success')
  const c = CONTENUS.find(x => x.id === devoirTache.value)
  devoirs.value.unshift({ membre: devoirMembre.value, tache: c.titre, fait: false })
  toast('Tâche envoyée · le bot relancera ' + devoirMembre.value + ' dans 3 jours si ce n\'est pas fait')
}
</script>

<template>
  <div class="page">
    <div class="chips">
      <button class="chip" :class="{ on: onglet === 'file' }" @click="onglet = 'file'">📥 Questions <b v-if="enAttente.length">· {{ enAttente.length }}</b></button>
      <button class="chip" :class="{ on: onglet === 'rdv' }" @click="onglet = 'rdv'">🗓️ Rendez-vous</button>
      <button class="chip" :class="{ on: onglet === 'devoirs' }" @click="onglet = 'devoirs'">✅ Suivi</button>
    </div>

    <!-- FILE DE QUESTIONS -->
    <template v-if="onglet === 'file'">
      <div class="card small muted">Questions que l'assistant n'a pas pu traiter. Vous répondez ici ; le bot transmet en privé. Votre numéro n'est jamais affiché.</div>

      <div v-for="q in enAttente" :key="q.id" class="card" :style="q.moi ? 'border:1.5px solid var(--accent)' : ''">
        <button class="row" style="width:100%;text-align:left;align-items:flex-start" @click="ouvrir(q)">
          <span class="icon" style="font-size:14px;font-weight:700">{{ q.membre.slice(0, 2) }}</span>
          <span class="grow">
            <span class="row" style="gap:6px"><b>{{ q.membre }}</b><span v-if="q.moi" class="pill">Nouveau</span><span class="muted small" style="margin-left:auto">{{ q.depuis }}</span></span>
            <span class="small" style="display:block;margin-top:4px">{{ q.texte }}</span>
          </span>
        </button>

        <div v-if="ouverte === q.id" style="margin-top:12px;display:flex;flex-direction:column;gap:10px">
          <div style="background:var(--bg);border-radius:10px;padding:10px 12px" class="small">
            <div class="strong" style="margin-bottom:4px">Fiche du membre</div>
            <div>Niveau : <b :style="{ color: niv(q.niveau).couleur }">{{ niv(q.niveau).nom }}</b> · objectif {{ q.objectif.toLowerCase() }} · {{ q.pays }}</div>
            <div v-if="q.historique.length" class="muted" style="margin-top:4px">Déjà demandé : {{ q.historique.join(' · ') }}</div>
            <div v-else class="muted" style="margin-top:4px">Première question</div>
          </div>
          <div class="field">
            <textarea v-model="texte" placeholder="Votre réponse écrite…" aria-label="Réponse écrite"></textarea>
          </div>
          <div class="row">
            <button class="btn sm" :class="enreg ? 'danger' : 'secondary'" @click="basculerVocal">
              {{ enreg ? '⏹ Arrêter · 0:' + String(secondes).padStart(2, '0') : '🎙 Répondre en vocal' }}
            </button>
            <span v-if="vocal" class="pill ok">🎧 Vocal prêt · 0:{{ String(vocal.duree).padStart(2, '0') }}</span>
          </div>
          <label class="row small"><input type="checkbox" v-model="pourFaq" /> Réponse utile à tous : proposer pour la FAQ</label>
          <button class="btn" :disabled="!texte.trim() && !vocal" @click="envoyer(q)">Envoyer à {{ q.membre }}</button>
        </div>
      </div>
      <div v-if="!enAttente.length" class="card muted" style="text-align:center">File vide. Bravo 👏</div>

      <template v-if="repondues.length">
        <div class="section-title">Répondu aujourd'hui</div>
        <div class="card flat">
          <div v-for="q in repondues" :key="q.id" class="list-item">
            <span class="icon">✓</span>
            <span class="grow"><b>{{ q.membre }}</b><br><span class="muted small">{{ q.reponse.vocal ? 'Vocal · ' : '' }}{{ q.reponse.texte || 'Réponse vocale' }}</span></span>
            <span v-if="q.reponse.faq" class="pill">FAQ</span>
          </div>
        </div>
      </template>
    </template>

    <!-- RENDEZ-VOUS -->
    <template v-if="onglet === 'rdv'">
      <div class="section-title">Aujourd'hui</div>
      <div v-for="r in RDV" :key="r.id" class="card">
        <div class="row"><span class="pill">{{ r.heure }}</span><b class="grow">{{ r.membre }}</b></div>
        <div class="small" style="margin:8px 0 10px">« {{ r.sujet }} »</div>
        <button class="btn sm" :class="r.lien ? 'secondary' : ''" :disabled="r.lien" @click="lien(r)">{{ r.lien ? '✓ Lien envoyé' : 'Envoyer le lien d\'appel' }}</button>
      </div>
      <div class="card small muted">Un bot ne peut pas lancer d'appel Telegram : il envoie aux deux un lien d'appel vidéo au moment du rendez-vous. Le membre note la séance ensuite.</div>
    </template>

    <!-- SUIVI / DEVOIRS -->
    <template v-if="onglet === 'devoirs'">
      <div class="card" style="display:flex;flex-direction:column;gap:10px">
        <div class="strong">Donner une tâche à un membre</div>
        <div class="field"><label for="dm">Membre</label>
          <select id="dm" v-model="devoirMembre"><option v-for="m in store.membres.slice(0, 8)" :key="m.id">{{ m.nom }}</option></select>
        </div>
        <div class="field"><label for="dt">À écouter</label>
          <select id="dt" v-model="devoirTache"><option v-for="c in CONTENUS.filter(c => c.type === 'etude' || c.type === 'audio')" :key="c.id" :value="c.id">{{ c.titre }}</option></select>
        </div>
        <button class="btn" @click="assigner">Envoyer la tâche</button>
      </div>
      <div class="section-title">Tâches en cours</div>
      <div class="card flat">
        <div v-for="(d, k) in devoirs" :key="k" class="list-item">
          <span class="icon">{{ d.fait ? '✅' : '⏳' }}</span>
          <span class="grow"><b>{{ d.membre }}</b><br><span class="muted small">{{ d.tache }}</span></span>
          <span class="pill" :class="d.fait ? 'ok' : 'warn'">{{ d.fait ? 'Fait' : 'En cours' }}</span>
        </div>
      </div>
    </template>
  </div>
</template>
