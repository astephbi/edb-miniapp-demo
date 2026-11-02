<script setup>
import { ref, computed } from 'vue'
import { store, aller, toast } from '../store.js'
import { NIVEAUX, SGI_COMPARATIF, CONTENUS, TYPES, FAQ } from '../data.js'
import { haptic } from '../telegram.js'

const moi = store.moi
const ouvert = ref(moi.parcours.findIndex(x => !x))
const faites = computed(() => moi.parcours.filter(Boolean).length)
const pieces = ref([true, true, false, false])
const vue = ref('rattrapage') // rattrapage | salons | parcours
const depuis = '2026-10-03'
const manque = CONTENUS.filter(c => c.date >= depuis && (c.type === 'etude' || c.type === 'audio')).sort((a, b) => b.date.localeCompare(a.date))
const ANNONCES = [
  { date: '31 oct.', txt: 'Relance des abonnements de fin de mois : vérifiez votre statut dans l\'app.' },
  { date: '18 oct.', txt: 'Nouveau calendrier des études du dimanche (17h et 18h).' },
  { date: '4 oct.', txt: 'Réorganisation du coaching individuel : réservation par l\'app.' }
]
const QUESTIONS = [
  { q: 'Quand le dividende est-il payé ?', faq: FAQ[0] },
  { q: 'Comment calculer mon CMP ?', faq: FAQ[1] },
  { q: "Pourquoi mon ordre n'est pas passé ?", faq: FAQ[2] }
]
const qOuverte = ref(-1)
const SALONS = [
  ['🏠', 'La Cour familiale', 'Annonces, études en direct du dimanche, vie de la communauté'],
  ['👶', 'Benjamins · Cadets · Seniors', 'Échanges selon votre objectif : 1, 6 ou 12 millions par an'],
  ['📈', 'Traders et Rentiers', 'Échanges selon votre stratégie'],
  ['💰', 'Finances saines', 'Budget, épargne, gestion personnelle'],
  ['📚', 'Études de l\'EDB', 'Replays des études · lecture seule'],
  ['⚡', 'Suggestions', 'Avis datés des coachs · lecture seule'],
  ['📄', 'Partenaires', 'Notes des SGI partenaires · lecture seule'],
  ['💎', 'Témoignages', 'Parcours de membres · lecture seule']
]
const REGLES = ['Pas de conseil personnalisé dans les salons : réservez un analyste.', 'Cherchez avant de demander : la recherche fouille aussi les audios.', 'Pas de publicité ni de sollicitation privée des membres.', 'Les performances passées ne garantissent pas les performances futures.']
function ecouter (c) { aller('lecteur', { lecture: { id: c.id, segment: 0 } }) }

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
    <div class="chips">
      <button class="chip" :class="{ on: vue === 'rattrapage' }" @click="vue = 'rattrapage'">⏪ Ce que vous avez manqué</button>
      <button class="chip" :class="{ on: vue === 'salons' }" @click="vue = 'salons'">🗂 Salons et règles</button>
      <button class="chip" :class="{ on: vue === 'parcours' }" @click="vue = 'parcours'">🧭 Parcours {{ faites }}/5</button>
    </div>

    <!-- RATTRAPAGE -->
    <template v-if="vue === 'rattrapage'">
      <div class="card">
        <div class="strong" style="font-size:16px">Le mois dernier en 5 minutes</div>
        <div class="muted small">Du 3 octobre à aujourd'hui · inutile de remonter les milliers de messages du groupe</div>
      </div>
      <div class="section-title">À écouter en priorité · {{ manque.length }}</div>
      <div class="card flat">
        <button v-for="c in manque" :key="c.id" class="list-item" @click="ecouter(c)">
          <span class="icon">{{ TYPES[c.type].icone }}</span>
          <span class="grow"><b>{{ c.titre }}</b><br><span class="muted small">{{ new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) }} · {{ c.duree }}</span></span>
          <span class="chev">›</span>
        </button>
      </div>
      <div class="section-title">Annonces importantes</div>
      <div class="card flat">
        <div v-for="(a, k) in ANNONCES" :key="k" class="list-item"><span class="pill grey" style="flex:none">{{ a.date }}</span><span class="small">{{ a.txt }}</span></div>
      </div>
      <div class="section-title">Les questions les plus posées</div>
      <div class="card flat">
        <div v-for="(x, k) in QUESTIONS" :key="k" style="border-top:1px solid var(--line)">
          <button class="list-item" style="border:0" @click="qOuverte = qOuverte === k ? -1 : k"><span class="grow strong small">{{ x.q }}</span><span class="chev">{{ qOuverte === k ? '⌄' : '›' }}</span></button>
          <div v-if="qOuverte === k" class="small" style="padding:0 14px 12px">{{ x.faq.rep }}</div>
        </div>
      </div>
      <button class="btn" @click="vue = 'parcours'">Continuer : mon parcours</button>
    </template>

    <!-- SALONS ET RÈGLES -->
    <template v-if="vue === 'salons'">
      <div class="card flat">
        <div v-for="(s, k) in SALONS" :key="k" class="list-item"><span class="icon">{{ s[0] }}</span><span class="grow"><b>{{ s[1] }}</b><br><span class="muted small">{{ s[2] }}</span></span></div>
      </div>
      <div class="section-title">Les règles</div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px">
        <div v-for="(r, k) in REGLES" :key="k" class="small">📌 {{ r }}</div>
      </div>
    </template>

    <template v-if="vue === 'parcours'">
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
    </template>
  </div>
</template>
