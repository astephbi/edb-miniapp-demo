import { reactive, computed } from 'vue'
import { MEMBRES_DEMO } from './data.js'
import { telegramUser, tg } from './telegram.js'

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
  recus: [],
  reel: false, // true quand l'app parle au vrai bot (API disponible et ouverte depuis Telegram)
  contenusReels: []
})

// ---------------------------------------------------------------- API du bot
// Ouverte dans Telegram et servie par le Worker : l'app utilise les vraies données.
// Sinon (navigateur, GitHub Pages) : elle reste en mode démonstration.

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
export const dateFr = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MOIS[m - 1]} ${y}` }

export async function api (path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: { 'content-type': 'application/json', 'x-telegram-init-data': tg ? tg.initData : '', ...(opts.headers || {}) } })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.erreur || 'Erreur ' + r.status)
  return data
}

function appliquerStatut (me) {
  const m = store.moi
  m.nom = me.prenom || m.nom
  m.formule = me.formule === 'annee' ? 'Année' : me.formule === 'trimestre' ? 'Trimestre' : '—'
  if (me.statut === 'actif') { m.statut = 'actif'; m.fin = "Jusqu'au " + dateFr(me.fin) }
  else if (me.statut === 'retard') { m.statut = 'retard'; m.fin = 'Expiré le ' + dateFr(me.fin) + ' · ' + me.grace + ' jours de grâce' }
  else if (me.statut === 'expire') { m.statut = 'expire'; m.fin = 'Expiré le ' + dateFr(me.fin) }
  else { m.statut = 'aucun'; m.fin = "Pas encore d'abonnement" }
}

const TYPE_APP = { audio: 'audio', video: 'etude', document: 'partenaire', texte: 'reco' }
export async function chargerContenus () {
  if (!store.reel) return
  try {
    const rows = await api('/api/contenus')
    store.contenusReels = rows.map(r => ({
      id: 'r' + r.id, type: TYPE_APP[r.type] || 'audio', titre: r.titre, societes: [], coach: 'EDB', date: r.created_at.slice(0, 10),
      duree: r.duree ? Math.round(r.duree / 60) + ' min' : '—',
      transcript: [{ t: 0, txt: r.extrait || r.titre }], reel: true
    }))
  } catch (e) { /* abonnement requis ou hors ligne */ }
}

export async function initReel () {
  if (!tg) return
  try {
    const me = await api('/api/me')
    store.reel = true
    appliquerStatut(me)
    await chargerContenus()
  } catch (e) { /* API absente : on reste en démo */ }
}

export async function payerReel (formule, moyen) {
  const r = await api('/api/pay', { method: 'POST', body: JSON.stringify({ formule, moyen }) })
  appliquerStatut(await api('/api/me'))
  await chargerContenus()
  return r
}

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
