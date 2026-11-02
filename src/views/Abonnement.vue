<script setup>
import { ref, computed } from 'vue'
import { store, actif, fcfa, aller, payerReel, dateFr } from '../store.js'
import { FORMULES, MOYENS } from '../data.js'
import { haptic } from '../telegram.js'

const moi = store.moi
const etape = ref(actif.value ? 'statut' : 'choix') // statut | choix | attente | recu
const formule = ref('annee')
const moyen = ref('wave')
const tel = ref('07 00 00 00 00')
const f = computed(() => FORMULES.find(x => x.id === formule.value))
const m = computed(() => MOYENS.find(x => x.id === moyen.value))
const recu = ref(null)

function finDans (mois) {
  const d = new Date('2026-11-02')
  d.setMonth(d.getMonth() + mois)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const erreur = ref('')
async function payer () {
  haptic('medium')
  etape.value = 'attente'
  erreur.value = ''
  if (store.reel) {
    try {
      const r = await payerReel(formule.value, m.value.nom)
      recu.value = { numero: r.ref, date: dateFr(r.debut), montant: r.montant, formule: r.formuleNom, moyen: m.value.nom, fin: dateFr(r.fin), membre: moi.nom }
      store.recus.unshift(recu.value)
      etape.value = 'recu'
      haptic('success')
    } catch (e) {
      erreur.value = e.message
      etape.value = 'choix'
      haptic('error')
    }
    return
  }
  // En production : l'API crée la transaction chez l'agrégateur de paiement,
  // le membre valide sur son téléphone, puis l'agrégateur confirme à l'API (webhook).
  setTimeout(() => {
    const r = {
      numero: 'EDB-' + Math.floor(100000 + Math.random() * 899999),
      date: '2 novembre 2026',
      montant: f.value.prix,
      formule: f.value.nom,
      moyen: m.value.nom,
      fin: finDans(f.value.mois),
      membre: moi.nom
    }
    recu.value = r
    store.recus.unshift(r)
    moi.statut = 'actif'
    moi.formule = f.value.nom
    moi.fin = "Jusqu'au " + r.fin
    etape.value = 'recu'
    haptic('success')
  }, 2200)
}
</script>

<template>
  <div class="page">
    <!-- Statut -->
    <div v-if="etape === 'statut'" class="card">
      <div class="row">
        <div class="icon" style="background:color-mix(in srgb,var(--ok) 13%,transparent)">✅</div>
        <div class="grow">
          <div class="strong">Abonnement actif</div>
          <div class="muted">{{ moi.formule }} · {{ moi.fin }}</div>
        </div>
      </div>
      <p class="muted small" style="margin:12px 0 0">Le bot vous préviendra 7 jours, puis 1 jour avant l'échéance. Vous ne perdez jamais l'accès par oubli.</p>
      <button class="btn secondary" style="margin-top:12px" @click="etape = 'choix'">Prolonger maintenant</button>
    </div>

    <!-- Choix -->
    <template v-if="etape === 'choix'">
      <div v-if="!actif" class="card row" style="border:1.5px solid var(--warn)">
        <div class="icon" style="background:color-mix(in srgb,var(--warn) 14%,transparent)">⏳</div>
        <div class="grow">
          <div class="strong">{{ moi.fin }}</div>
          <div class="muted small">Encore 5 jours de grâce avant le retrait automatique du groupe.</div>
        </div>
      </div>

      <div class="section-title">Formule</div>
      <div class="card flat">
        <button v-for="x in FORMULES" :key="x.id" class="list-item" @click="formule = x.id">
          <div class="grow">
            <div class="strong">{{ x.nom }} <span v-if="x.badge" class="pill ok" style="margin-left:6px">{{ x.badge }}</span></div>
            <div class="muted small">Accès complet pendant {{ x.duree }}</div>
          </div>
          <div class="strong">{{ fcfa(x.prix) }}</div>
          <span style="font-size:20px">{{ formule === x.id ? '🔘' : '⚪' }}</span>
        </button>
      </div>

      <div class="section-title">Payer avec</div>
      <div class="card" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button v-for="x in MOYENS" :key="x.id" @click="moyen = x.id"
          :style="{ border: '2px solid ' + (moyen === x.id ? x.couleur : 'var(--line)'), borderRadius: '12px', padding: '12px 8px', fontWeight: 650 }">
          <span :style="{ display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', background:x.couleur, marginRight:'6px' }"></span>{{ x.nom }}
        </button>
      </div>

      <div class="card field">
        <label for="tel">Numéro {{ m.nom }}</label>
        <input id="tel" v-model="tel" inputmode="tel" />
      </div>

      <div v-if="erreur" class="card small" style="color:var(--danger)">⚠️ {{ erreur }}</div>
      <button class="btn" @click="payer">Payer {{ fcfa(f.prix) }}</button>
      <p class="muted small" style="text-align:center;margin:-4px 0 0">{{ store.reel ? 'Mode test : aucun argent n\'est débité. Le reçu et le lien du groupe arrivent dans le chat du bot.' : 'Paiement simulé pour la démo. En réel : validation sur votre téléphone, reçu instantané.' }}</p>
    </template>

    <!-- Attente -->
    <div v-if="etape === 'attente'" class="card" style="display:grid;place-items:center;gap:12px;padding:36px 16px;text-align:center">
      <div class="spinner"></div>
      <div class="strong">Validez le paiement sur votre téléphone</div>
      <div class="muted">{{ m.nom }} · {{ tel }} · {{ fcfa(f.prix) }}</div>
    </div>

    <!-- Reçu -->
    <template v-if="etape === 'recu' && recu">
      <div class="card" style="text-align:center;padding:22px 16px">
        <div style="font-size:42px">🎉</div>
        <div class="big" style="margin-top:4px">Paiement reçu</div>
        <div class="muted">Accès rétabli à tous les salons et replays</div>
      </div>
      <div class="card">
        <div class="row" style="justify-content:space-between"><span class="muted">Reçu n°</span><span class="strong">{{ recu.numero }}</span></div>
        <div class="row" style="justify-content:space-between;margin-top:8px"><span class="muted">Formule</span><span>{{ recu.formule }}</span></div>
        <div class="row" style="justify-content:space-between;margin-top:8px"><span class="muted">Montant</span><span>{{ fcfa(recu.montant) }}</span></div>
        <div class="row" style="justify-content:space-between;margin-top:8px"><span class="muted">Moyen</span><span>{{ recu.moyen }}</span></div>
        <div class="row" style="justify-content:space-between;margin-top:8px"><span class="muted">Valable jusqu'au</span><span class="strong">{{ recu.fin }}</span></div>
      </div>
      <p class="muted small" style="text-align:center;margin:0">Le reçu vous est aussi envoyé en message privé par le bot.</p>
      <button class="btn" @click="aller('bibliotheque')">Ouvrir la bibliothèque</button>
    </template>
  </div>
</template>
