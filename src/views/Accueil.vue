<script setup>
import { computed } from 'vue'
import { store, aller, actif, fcfa, toast } from '../store.js'
import { NIVEAUX, CONTENUS, AGENDA, TYPES } from '../data.js'
import { haptic } from '../telegram.js'

const moi = store.moi
const niveau = computed(() => NIVEAUX.find(n => n.id === moi.niveau))
const prochain = computed(() => NIVEAUX[NIVEAUX.findIndex(n => n.id === moi.niveau) + 1])
const pct = computed(() => Math.min(100, Math.round(moi.dividendesAnnuels / niveau.value.seuil * 100)))
const reprise = computed(() => {
  const id = Object.keys(moi.reprise)[0]
  const c = CONTENUS.find(x => x.id === id)
  return c ? { c, seg: moi.reprise[id] } : null
})
const nouveautes = CONTENUS.filter(c => c.type === 'etude').slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2)
const etapes = computed(() => moi.parcours.filter(Boolean).length)

function rappel (a) {
  haptic('light')
  const i = moi.rappels.indexOf(a.id)
  if (i >= 0) { moi.rappels.splice(i, 1); toast('Rappel retiré') } else { moi.rappels.push(a.id); toast('Le bot vous rappellera 1 h avant · ' + a.heure) }
}
function ouvrir (c, seg = 0) { aller('lecteur', { lecture: { id: c.id, segment: seg } }) }
</script>

<template>
  <div class="page">
    <div>
      <div class="muted">Bonjour,</div>
      <div class="big">{{ moi.nom }}</div>
    </div>

    <!-- Statut d'abonnement : douleurs 1, 2 et 5 -->
    <div v-if="!actif" class="card" style="border:1.5px solid var(--warn)">
      <div class="row">
        <div class="icon" style="background:color-mix(in srgb,var(--warn) 14%,transparent)">⏳</div>
        <div class="grow">
          <div class="strong">Votre abonnement a expiré</div>
          <div class="muted">{{ moi.fin }} · les replays sont verrouillés</div>
        </div>
      </div>
      <button class="btn" style="margin-top:12px" @click="aller('abonnement')">Renouveler en 1 minute</button>
    </div>
    <div v-else class="card row">
      <div class="icon" style="background:color-mix(in srgb,var(--ok) 13%,transparent)">✅</div>
      <div class="grow">
        <div class="strong">Abonnement actif</div>
        <div class="muted">{{ moi.formule }} · {{ moi.fin }}</div>
      </div>
      <span class="pill ok">À jour</span>
    </div>

    <!-- Réponses des coachs -->
    <div v-for="(r, k) in store.reponses" :key="'rep' + k" class="card" style="border:1.5px solid var(--accent)">
      <div class="row"><div class="icon">💬</div><div class="grow"><div class="strong">Réponse de {{ r.coach }}</div><div class="muted small">À votre question : « {{ r.question }} »</div></div></div>
      <div v-if="r.vocal" class="row" style="margin-top:10px;background:var(--bg);border-radius:10px;padding:8px 10px">
        <span>▶</span><div class="progress grow"><div style="width:0%"></div></div><span class="muted small">0:{{ String(r.vocal.duree).padStart(2, '0') }}</span>
      </div>
      <p v-if="r.texte" style="margin:10px 0 0">{{ r.texte }}</p>
    </div>

    <!-- Progression : douleur 24 -->
    <div class="card">
      <div class="row">
        <div class="grow">
          <div class="muted small">Mon niveau</div>
          <div class="strong" style="font-size:17px">{{ niveau.nom }} · {{ niveau.objectif }}</div>
        </div>
        <span class="pill" :style="{ background: niveau.couleur + '22', color: niveau.couleur }">{{ pct }} %</span>
      </div>
      <div class="progress" style="margin:12px 0 8px"><div :style="{ width: pct + '%' }"></div></div>
      <div class="muted small">{{ fcfa(moi.dividendesAnnuels) }} de dividendes annuels déclarés sur {{ fcfa(niveau.seuil) }}.
        <template v-if="prochain"> Prochain palier : <b>{{ prochain.nom }}</b><span v-if="prochain.nouveau"> (nouveau)</span>.</template>
      </div>
    </div>

    <!-- Parcours nouveau membre : douleurs 25 à 27 -->
    <button v-if="etapes < 5" class="card row" style="text-align:left" @click="aller('parcours')">
      <div class="icon">🧭</div>
      <div class="grow">
        <div class="strong">Nouveau ? Rattrapez le mois en 5 minutes</div>
        <div class="muted">Ce que vous avez manqué · salons et règles · parcours {{ etapes }}/5</div>
        <div class="progress" style="margin-top:8px"><div :style="{ width: etapes * 20 + '%' }"></div></div>
      </div>
      <span class="chev">›</span>
    </button>

    <!-- Reprise d'écoute : douleur 15 -->
    <template v-if="reprise">
      <div class="section-title">Reprendre l'écoute</div>
      <button class="card row" style="text-align:left" @click="ouvrir(reprise.c, reprise.seg)">
        <div class="icon">▶️</div>
        <div class="grow">
          <div class="strong">{{ reprise.c.titre }}</div>
          <div class="muted">Arrêté au passage {{ reprise.seg + 1 }}/{{ reprise.c.transcript.length }}</div>
        </div>
        <span class="chev">›</span>
      </button>
    </template>

    <div class="section-title">Nouvelles études</div>
    <div class="card flat">
      <button v-for="c in nouveautes" :key="c.id" class="list-item" @click="ouvrir(c)">
        <div class="icon">{{ TYPES[c.type].icone }}</div>
        <div class="grow">
          <div class="strong">{{ c.titre }}</div>
          <div class="muted">{{ new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) }} · {{ c.duree }}</div>
        </div>
        <span v-if="!actif">🔒</span><span v-else-if="c.nouveau" class="pill">Nouveau</span>
      </button>
    </div>

    <!-- Agenda : douleur 16 et 28 -->
    <div class="section-title">Agenda</div>
    <div class="card flat">
      <div v-for="a in AGENDA" :key="a.id" class="list-item">
        <div style="width:62px;flex:none">
          <div class="strong small">{{ a.jour }}</div>
          <div class="muted small">{{ a.heure }}</div>
        </div>
        <div class="grow">
          <div class="strong" style="font-size:14px">{{ a.titre }}</div>
          <div class="muted small">{{ a.lieu }}</div>
        </div>
        <button v-if="a.type === 'coaching'" class="btn sm secondary" @click="aller('rdv')">Réserver</button>
        <button v-else class="btn sm" :class="moi.rappels.includes(a.id) ? '' : 'secondary'" @click="rappel(a)">{{ moi.rappels.includes(a.id) ? '🔔' : 'Rappel' }}</button>
      </div>
    </div>
  </div>
</template>
