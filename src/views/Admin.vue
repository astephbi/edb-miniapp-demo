<script setup>
import { ref, computed } from 'vue'
import { store, fcfa, toast } from '../store.js'
import { NIVEAUX } from '../data.js'
import { haptic } from '../telegram.js'

// Chiffres de démonstration, fictifs.
const onglet = ref('pilotage')
const paye = computed(() => store.recus.length)
const kpi = computed(() => ({
  aJour: 3960 + paye.value,
  retard: 612 - Math.min(paye.value, 1),
  retires: 227,
  encaisse: 1240000 + store.recus.reduce((s, r) => s + r.montant, 0)
}))
const relanceFaite = ref(false)
function relancerTous () {
  haptic('success')
  relanceFaite.value = true
  store.membres.forEach(m => { if (m.statut === 'retard') m.relance = true })
  toast(kpi.value.retard + ' relances envoyées en privé par le bot, avec lien de paiement')
}

const filtre = ref('tous')
const q = ref('')
const membres = computed(() => store.membres
  .filter(m => filtre.value === 'tous' || m.statut === filtre.value)
  .filter(m => !q.value || m.nom.toLowerCase().includes(q.value.toLowerCase())))
const STATUTS = { actif: ['ok', 'À jour'], retard: ['warn', 'En retard'], expire: ['danger', 'Retiré'] }
function relancer (m) { haptic('light'); m.relance = true; toast('Relance envoyée à ' + m.nom) }
function reintegrer (m) { haptic('light'); toast('Lien d\'invitation personnel envoyé à ' + m.nom) }

const EFFECTIFS = { benjamin: 1830, palier: 0, cadet: 1420, senior: 610 }
const message = ref('📅 Dimanche 17h : étude en direct de deux valeurs de la cote. Le replay sera dans la bibliothèque.')
const cibles = ref(['benjamin', 'cadet', 'senior'])
const aussiPrive = ref(true)
const portee = computed(() => cibles.value.reduce((s, c) => s + EFFECTIFS[c], 0))
function publier () {
  haptic('success')
  toast('Publié une seule fois → ' + cibles.value.length + ' salons' + (aussiPrive.value ? ' + ' + portee.value.toLocaleString('fr-FR') + ' messages privés' : ''))
}

const ANALYSTES = [
  { nom: 'Analyste n°1', jours: 'Lun. – Mar.', attente: 9, delai: '14 h', note: 4.6 },
  { nom: 'Analyste n°2', jours: 'Jeu. – Ven.', attente: 5, delai: '22 h', note: 4.1 }
]
const TOP = [
  { titre: 'Comprendre le CMP sans se tromper', ecoutes: 1284 },
  { titre: 'Analyse fondamentale — NSIA Banque & Nestlé CI', ecoutes: 961 },
  { titre: "Pourquoi mon ordre n'est pas passé ?", ecoutes: 744 }
]
const RECUS_DEMO = [
  { membre: 'Koffi K.', montant: 70000, moyen: 'Wave', date: 'hier' },
  { membre: 'Fatou N.', montant: 20000, moyen: 'Orange Money', date: 'hier' },
  { membre: 'Serge M.', montant: 20000, moyen: 'Moov Money', date: '31 oct.' }
]
</script>

<template>
  <div class="page">
    <div class="chips">
      <button v-for="(l, k) in { pilotage: '📊 Pilotage', membres: '👥 Membres', annonce: '📣 Annonce', coaching: '🎓 Coaching' }" :key="k"
        class="chip" :class="{ on: onglet === k }" @click="onglet = k">{{ l }}</button>
    </div>

    <!-- PILOTAGE : douleurs 1, 3, 6 -->
    <template v-if="onglet === 'pilotage'">
      <div class="kpis">
        <div class="kpi"><div class="v">4 799</div><div class="l">membres dans le groupe</div></div>
        <div class="kpi"><div class="v" style="color:var(--ok)">{{ kpi.aJour.toLocaleString('fr-FR') }}</div><div class="l">abonnés à jour</div></div>
        <div class="kpi"><div class="v" style="color:var(--warn)">{{ kpi.retard }}</div><div class="l">en retard (délai de grâce)</div></div>
        <div class="kpi"><div class="v" style="color:var(--danger)">{{ kpi.retires }}</div><div class="l">retirés automatiquement</div></div>
      </div>
      <div class="card">
        <div class="muted small">Encaissé en novembre</div>
        <div class="big">{{ fcfa(kpi.encaisse) }}</div>
        <div class="muted small">Taux de renouvellement sur 90 jours : <b>81 %</b></div>
      </div>
      <div class="card">
        <div class="strong">{{ kpi.retard }} membres en retard</div>
        <div class="muted small" style="margin:4px 0 12px">Chacun reçoit en privé un message avec son lien de paiement. Sans paiement après 5 jours, le bot le retire ; dès qu'il paie, il est réintégré.</div>
        <button class="btn" :disabled="relanceFaite" @click="relancerTous">{{ relanceFaite ? '✓ Relances envoyées' : 'Relancer les ' + kpi.retard + ' maintenant' }}</button>
      </div>
      <div class="section-title">Derniers paiements</div>
      <div class="card flat">
        <div v-for="(r, k) in store.recus" :key="'r' + k" class="list-item" style="background:var(--accent-soft)">
          <span class="icon">💸</span><span class="grow"><b>{{ r.membre }}</b> · {{ r.moyen }}<br><span class="muted small">à l'instant · reçu {{ r.numero }}</span></span><b>{{ fcfa(r.montant) }}</b>
        </div>
        <div v-for="(r, k) in RECUS_DEMO" :key="k" class="list-item">
          <span class="icon">💸</span><span class="grow"><b>{{ r.membre }}</b> · {{ r.moyen }}<br><span class="muted small">{{ r.date }}</span></span><b>{{ fcfa(r.montant) }}</b>
        </div>
      </div>
      <p v-if="!store.recus.length" class="muted small" style="margin:-4px 4px 0">Astuce démo : passez en vue Membre, payez l'abonnement, puis revenez ici.</p>
    </template>

    <!-- MEMBRES : douleurs 1 à 3 -->
    <template v-if="onglet === 'membres'">
      <div class="search"><span>🔎</span><input v-model="q" placeholder="Chercher un membre" aria-label="Chercher un membre" /></div>
      <div class="chips">
        <button class="chip" :class="{ on: filtre === 'tous' }" @click="filtre = 'tous'">Tous</button>
        <button class="chip" :class="{ on: filtre === 'actif' }" @click="filtre = 'actif'">À jour</button>
        <button class="chip" :class="{ on: filtre === 'retard' }" @click="filtre = 'retard'">En retard</button>
        <button class="chip" :class="{ on: filtre === 'expire' }" @click="filtre = 'expire'">Retirés</button>
      </div>
      <div class="card flat">
        <div v-for="m in membres" :key="m.id" class="list-item">
          <span class="icon" style="font-size:14px;font-weight:700">{{ m.nom.slice(0, 2) }}</span>
          <span class="grow">
            <b>{{ m.nom }}</b> <span class="muted small">· {{ NIVEAUX.find(n => n.id === m.niveau).nom }}</span><br>
            <span class="muted small">{{ m.formule }} · {{ m.fin }} · {{ m.pays }}</span>
          </span>
          <span v-if="m.statut === 'actif'" class="pill ok">À jour</span>
          <button v-else-if="m.statut === 'retard'" class="btn sm" :class="m.relance ? 'secondary' : ''" :disabled="m.relance" @click="relancer(m)">{{ m.relance ? 'Relancé' : 'Relancer' }}</button>
          <button v-else class="btn sm secondary" @click="reintegrer(m)">Inviter</button>
        </div>
      </div>
    </template>

    <!-- ANNONCE : douleur 4 -->
    <template v-if="onglet === 'annonce'">
      <div class="card small muted">Écrivez une fois, choisissez qui la reçoit. Fini le même message copié dans six salons.</div>
      <div class="card field">
        <label for="msg">Message</label>
        <textarea id="msg" v-model="message"></textarea>
      </div>
      <div class="card">
        <div class="muted small strong" style="margin-bottom:8px">Destinataires</div>
        <label v-for="n in NIVEAUX" :key="n.id" class="row" style="padding:6px 0">
          <input type="checkbox" :value="n.id" v-model="cibles" />
          <span class="grow">{{ n.nom }}</span><span class="muted small">{{ EFFECTIFS[n.id].toLocaleString('fr-FR') }}</span>
        </label>
        <label class="row" style="padding:8px 0 0;border-top:1px solid var(--line);margin-top:6px">
          <input type="checkbox" v-model="aussiPrive" /><span class="grow">Aussi en message privé (notification garantie)</span>
        </label>
      </div>
      <button class="btn" :disabled="!cibles.length" @click="publier">Publier · {{ portee.toLocaleString('fr-FR') }} membres</button>
    </template>

    <!-- COACHING : douleurs 9 à 11 -->
    <template v-if="onglet === 'coaching'">
      <div class="card flat">
        <div v-for="a in ANALYSTES" :key="a.nom" class="list-item">
          <span class="icon">🎓</span>
          <span class="grow"><b>{{ a.nom }}</b> · <span class="muted small">{{ a.jours }}</span><br>
            <span class="muted small">{{ a.attente }} questions en attente · réponse en {{ a.delai }}</span></span>
          <span class="pill" :class="a.note >= 4.5 ? 'ok' : 'warn'">⭐ {{ a.note }}</span>
        </div>
      </div>
      <div class="card small muted">Les notes viennent des membres après chaque rendez-vous : les retours arrivent ici, plus dans votre WhatsApp.</div>
      <div class="section-title">Contenus les plus écoutés</div>
      <div class="card flat">
        <div v-for="(t, k) in TOP" :key="k" class="list-item">
          <span class="strong" style="width:20px">{{ k + 1 }}</span><span class="grow">{{ t.titre }}</span><span class="muted small">{{ t.ecoutes.toLocaleString('fr-FR') }} écoutes</span>
        </div>
      </div>
      <div class="card small muted">Questions les plus posées à l'assistant cette semaine : dividendes, CMP, ordres non exécutés. Elles alimentent la FAQ validée par les coachs.</div>
    </template>
  </div>
</template>
