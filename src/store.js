import { reactive, computed } from 'vue'
import { MEMBRES_DEMO } from './data.js'
import { telegramUser } from './telegram.js'

const u = telegramUser()

// État partagé entre l'espace membre et l'espace Brice.
// En production, tout ceci vient de l'API (abonnements, paiements, accès).
export const store = reactive({
  role: 'membre', // 'membre' | 'admin'
  vue: 'accueil',
  historique: [],
  moi: {
    id: 'moi',
    nom: u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : 'Awa B.',
    niveau: 'benjamin',
    statut: 'retard', // le scénario de démo commence avec un abonnement échu
    fin: 'Expiré depuis 2 jours',
    formule: 'Trimestre',
    dividendesAnnuels: 640000,
    parcours: [true, true, false, false, false],
    rappels: ['a1'],
    reprise: { c5: 2 }
  },
  membres: MEMBRES_DEMO,
  lecture: { id: null, segment: 0 },
  // File de questions transmises aux coachs (démo)
  questions: [
    { id: 'q1', membre: 'Koffi K.', niveau: 'palier', objectif: 'Rente', pays: "Côte d'Ivoire", depuis: 'il y a 2 h', texte: "J'ai 3 lignes bancaires et 1 télécom. Est-ce que je suis trop concentré sur les banques pour un objectif de rente ?", historique: ['Comment calculer mon rendement global ?', 'Quand tombe le dividende BOA ?'], statut: 'attente' },
    { id: 'q2', membre: 'Fatou N.', niveau: 'benjamin', objectif: 'Croissance', pays: 'France', depuis: 'il y a 5 h', texte: "Mon virement depuis la France n'est pas arrivé après 6 jours. Que dois-je demander à ma SGI ?", historique: ['Quelle SGI accepte les virements depuis la France ?'], statut: 'attente' },
    { id: 'q3', membre: 'Ibrahim A.', niveau: 'cadet', objectif: 'Rente', pays: 'Sénégal', depuis: 'hier', texte: 'Je veux participer à la prochaine augmentation de capital. Comment savoir si je dois acheter des DPS ?', historique: [], statut: 'attente' }
  ],
  reponses: [], // réponses reçues par « moi »
  toast: null,
  recus: []
})

export const actif = computed(() => store.moi.statut === 'actif')

export function aller (vue, params = {}) {
  if (vue === store.vue && !params.force) return
  store.historique.push(store.vue)
  store.vue = vue
  Object.assign(store.lecture, params.lecture || {})
  window.scrollTo(0, 0)
}

export function retour () {
  store.vue = store.historique.pop() || 'accueil'
  window.scrollTo(0, 0)
}

let toastTimer = null
export function toast (msg) {
  store.toast = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { store.toast = null }, 2800)
}

export function mmss (t) { return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0') }

export function fcfa (n) {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/ | /g, ' ') + ' F'
}
