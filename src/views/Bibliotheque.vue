<script setup>
import { ref, computed } from 'vue'
import { store, aller, actif, toast, mmss } from '../store.js'
import { CONTENUS, TYPES } from '../data.js'

const q = ref('')
const type = ref('tous')
const societe = ref('toutes')
const societes = [...new Set(CONTENUS.flatMap(c => c.societes))].sort()

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const resultats = computed(() => {
  const n = norm(q.value.trim())
  return [...store.contenusReels, ...CONTENUS]
    .filter(c => type.value === 'tous' || c.type === type.value)
    .filter(c => societe.value === 'toutes' || c.societes.includes(societe.value))
    .map(c => {
      if (!n) return { c, hits: [] }
      const dansTitre = norm(c.titre + ' ' + c.societes.join(' ') + ' ' + (c.tags || []).join(' ')).includes(n)
      const hits = c.transcript.map((s, i) => ({ ...s, i })).filter(s => norm(s.txt).includes(n))
      return (dansTitre || hits.length) ? { c, hits } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.hits.length - a.hits.length || b.c.date.localeCompare(a.c.date))
})

function surligner (txt) {
  const n = q.value.trim()
  if (!n) return txt
  const i = norm(txt).indexOf(norm(n))
  if (i < 0) return txt
  let debut = Math.max(0, i - 50)
  if (debut > 0) { const sp = txt.indexOf(' ', debut); debut = sp > -1 && sp < i ? sp + 1 : debut }
  const avant = (debut > 0 ? '… ' : '') + txt.slice(debut, i)
  return esc(avant) + '<mark>' + esc(txt.slice(i, i + n.length)) + '</mark>' + esc(txt.slice(i + n.length, i + n.length + 70)) + '…'
}
function esc (s) { return s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])) }

function ouvrir (c, seg = 0) {
  if (!actif.value) { toast('🔒 Réservé aux abonnés à jour'); aller('abonnement'); return }
  aller('lecteur', { lecture: { id: c.id, segment: seg } })
}
const suggestions = ['dividende', 'CMP', 'ordre', 'diaspora']
</script>

<template>
  <div class="page">
    <div class="search">
      <span>🔎</span>
      <input v-model="q" placeholder="Chercher dans les titres et dans les audios…" aria-label="Rechercher" />
      <button v-if="q" @click="q = ''" class="muted">✕</button>
    </div>
    <div v-if="!q" class="chips">
      <span class="muted small" style="align-self:center">Essayer :</span>
      <button v-for="s in suggestions" :key="s" class="chip" @click="q = s">{{ s }}</button>
    </div>

    <div class="chips">
      <button class="chip" :class="{ on: type === 'tous' }" @click="type = 'tous'">Tout</button>
      <button v-for="(t, k) in TYPES" :key="k" class="chip" :class="{ on: type === k }" @click="type = k">{{ t.icone }} {{ t.nom }}</button>
    </div>
    <div class="chips">
      <button class="chip" :class="{ on: societe === 'toutes' }" @click="societe = 'toutes'">Toutes les sociétés</button>
      <button v-for="s in societes" :key="s" class="chip" :class="{ on: societe === s }" @click="societe = s">{{ s }}</button>
    </div>

    <div v-if="!actif" class="card row small" style="border:1.5px solid var(--warn)">
      <span>🔒</span><span class="grow">Contenus verrouillés : abonnement échu.</span>
      <button class="btn sm" @click="aller('abonnement')">Renouveler</button>
    </div>

    <div class="muted small" style="margin:0 4px -6px">{{ resultats.length }} résultat{{ resultats.length > 1 ? 's' : '' }}<span v-if="q"> pour « {{ q }} »</span></div>

    <div class="card flat">
      <div v-for="r in resultats" :key="r.c.id" style="border-top:1px solid var(--line)">
        <button class="list-item" style="border:0" @click="ouvrir(r.c)">
          <div class="icon">{{ TYPES[r.c.type].icone }}</div>
          <div class="grow">
            <div class="strong">{{ r.c.titre }}</div>
            <div class="muted small">{{ r.c.coach }} · {{ new Date(r.c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) }} · {{ r.c.duree }}</div>
          </div>
          <span v-if="!actif">🔒</span><span v-else class="chev">›</span>
        </button>
        <button v-for="h in r.hits.slice(0, 2)" :key="h.i" class="row" style="padding:0 14px 12px 66px;text-align:left;width:100%" @click="ouvrir(r.c, h.i)">
          <span class="pill" style="flex:none">▶ {{ mmss(h.t) }}</span>
          <span class="small" v-html="surligner(h.txt)"></span>
        </button>
      </div>
      <div v-if="!resultats.length" style="padding:24px;text-align:center" class="muted">Aucun résultat. Posez la question à l'assistant.</div>
    </div>
  </div>
</template>
