<script setup>
import { ref, computed } from 'vue'
import { store, aller, toast } from '../store.js'
import { NIVEAUX, SGI_COMPARATIF } from '../data.js'
import { haptic } from '../telegram.js'

const moi = store.moi
const ouvert = ref(moi.parcours.findIndex(x => !x))
const faites = computed(() => moi.parcours.filter(Boolean).length)
const pieces = ref([true, true, false, false])

const ETAPES = [
  { titre: 'Mon objectif', sous: 'Choisir mon niveau de départ' },
  { titre: 'Choisir ma SGI', sous: 'Comparatif tenu par la communauté' },
  { titre: 'Ouvrir mon compte-titres', sous: 'Les pièces à préparer' },
  { titre: 'Alimenter mon compte', sous: 'Mobile money, virement, délais' },
  { titre: 'Ma première étude', sous: 'Comprendre avant d’acheter' }
]

function valider (k) {
  haptic('success')
  moi.parcours[k] = true
  ouvert.value = moi.parcours.findIndex(x => !x)
  if (ouvert.value < 0) toast('🎓 Parcours terminé ! Bienvenue dans la communauté.')
}
</script>

<template>
  <div class="page">
    <div class="card">
      <div class="row"><div class="grow strong">Votre progression</div><span class="pill">{{ faites }}/5</span></div>
      <div class="progress" style="margin-top:10px"><div :style="{ width: faites * 20 + '%' }"></div></div>
      <p class="muted small" style="margin:10px 0 0">Les réponses aux questions que tous les nouveaux posent dans le groupe, rangées dans l'ordre.</p>
    </div>

    <div v-for="(e, k) in ETAPES" :key="k" class="card">
      <button class="row" style="width:100%;text-align:left" @click="ouvert = ouvert === k ? -1 : k">
        <span class="icon" :style="moi.parcours[k] ? 'background:color-mix(in srgb,var(--ok) 15%,transparent)' : ''">{{ moi.parcours[k] ? '✓' : k + 1 }}</span>
        <span class="grow"><span class="strong" style="display:block">{{ e.titre }}</span><span class="muted small">{{ e.sous }}</span></span>
        <span class="chev">{{ ouvert === k ? '⌄' : '›' }}</span>
      </button>

      <div v-if="ouvert === k" style="margin-top:12px;display:flex;flex-direction:column;gap:10px">
        <template v-if="k === 0">
          <div class="muted small">Quel revenu de dividendes visez-vous par an ?</div>
          <button v-for="n in NIVEAUX" :key="n.id" class="row" style="padding:10px 12px;border-radius:10px;text-align:left"
            :style="{ border: '2px solid ' + (moi.niveau === n.id ? n.couleur : 'var(--line)') }" @click="moi.niveau = n.id">
            <span class="grow"><b>{{ n.nom }}</b> · {{ n.objectif }}</span><span v-if="n.nouveau" class="pill">Nouveau palier</span>
          </button>
        </template>

        <template v-if="k === 1">
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead><tr class="muted" style="text-align:left"><th style="padding:6px 4px">SGI</th><th>Ouverture</th><th>Mobile money</th><th>Délai</th><th>Avis</th></tr></thead>
              <tbody><tr v-for="s in SGI_COMPARATIF" :key="s.nom" style="border-top:1px solid var(--line)">
                <td style="padding:8px 4px;font-weight:600">{{ s.nom }}</td><td>{{ s.ouverture }}</td><td>{{ s.mobileMoney }}</td><td>{{ s.delai }}</td><td>⭐ {{ s.avis }}</td>
              </tr></tbody>
            </table>
          </div>
          <div class="muted small">Démo : en réel, les notes viennent des avis des membres, mis à jour chaque mois.</div>
        </template>

        <template v-if="k === 2">
          <label v-for="(p, j) in ['Pièce d’identité ou passeport en cours de validité', 'Justificatif de domicile', 'Photo d’identité récente', 'Formulaire d’ouverture de la SGI signé']" :key="j" class="row small">
            <input type="checkbox" v-model="pieces[j]" /> <span>{{ p }}</span>
          </label>
          <div class="muted small">La liste exacte dépend de la SGI : elle s'affiche ici selon celle choisie à l'étape 2.</div>
        </template>

        <template v-if="k === 3">
          <div class="small">📱 <b>Mobile money</b> : le plus rapide si votre SGI l'accepte.</div>
          <div class="small">🏦 <b>Virement bancaire</b> : comptez plusieurs jours ouvrés.</div>
          <div class="small">🌍 <b>Depuis l'étranger</b> : voir l'audio spécial diaspora.</div>
          <div class="small">🧾 Gardez toujours la preuve et envoyez-la par écrit à votre SGI.</div>
        </template>

        <template v-if="k === 4">
          <div class="small">Commencez par l'audio sur le CMP, puis la dernière étude du dimanche.</div>
          <button class="btn secondary" @click="aller('bibliotheque')">Ouvrir la bibliothèque</button>
        </template>

        <button v-if="!moi.parcours[k]" class="btn" @click="valider(k)">C'est fait</button>
      </div>
    </div>
  </div>
</template>
