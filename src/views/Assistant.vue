<script setup>
import { ref, nextTick } from 'vue'
import { store, aller, actif, toast } from '../store.js'
import { FAQ, CONTENUS } from '../data.js'
import { haptic } from '../telegram.js'

const msgs = ref([
  { de: 'bot', txt: "Bonjour ! Je réponds à partir des cours et des audios de l'EDB, et je cite toujours ma source. Pour une décision personnelle, je vous oriente vers un analyste." }
])
const saisie = ref('')
const reflechit = ref(false)
const suggestions = ['Quand le dividende est-il payé ?', 'Comment calculer mon CMP ?', "Mon ordre n'est pas passé", 'Dois-je acheter maintenant ?']

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function repondre (q) {
  const n = norm(q)
  if (/(dois.je|faut.il|je (veux|vais) (acheter|vendre)|que pensez|votre avis|acheter maintenant|bon moment|quelle (action|valeur))/.test(n)) {
    return { txt: "Je ne donne pas de conseil d'achat ou de vente personnalisé : cela dépend de votre objectif (rente ou croissance) et de votre portefeuille. Les avis EDB datés sont dans la bibliothèque, et un analyste peut étudier votre cas.", rdv: true }
  }
  const f = FAQ.find(x => x.cles.some(k => n.includes(norm(k))))
  if (f) {
    const c = f.source ? CONTENUS.find(x => x.id === f.source) : null
    const seg = c ? Math.max(0, c.transcript.findIndex(s => s.t === f.moment)) : 0
    return { txt: f.rep, source: c, seg, parcours: f.action === 'parcours' }
  }
  return { txt: "Je n'ai pas trouvé de réponse fiable dans les contenus EDB. Je préfère ne pas inventer : votre question peut être transmise à un analyste.", rdv: true }
}

async function envoyer (q) {
  q = (q || saisie.value).trim()
  if (!q || reflechit.value) return
  haptic('light')
  msgs.value.push({ de: 'moi', txt: q })
  saisie.value = ''
  reflechit.value = true
  await descendre()
  setTimeout(async () => {
    msgs.value.push({ de: 'bot', question: q, ...repondre(q) })
    reflechit.value = false
    await descendre()
  }, 750)
}
function transmettre (m) {
  haptic('success')
  m.transmis = true
  store.questions.unshift({ id: 'qm' + Date.now(), moi: true, membre: store.moi.nom, niveau: store.moi.niveau, objectif: 'Rente', pays: "Côte d'Ivoire", depuis: "à l'instant", texte: m.question, historique: ['Comment calculer mon CMP ?'], statut: 'attente' })
  toast("Question transmise à l'analyste de permanence · réponse en privé")
}

async function descendre () { await nextTick(); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }) }

function ecouter (m) {
  if (!actif.value) { toast('🔒 Réservé aux abonnés à jour'); aller('abonnement'); return }
  aller('lecteur', { lecture: { id: m.source.id, segment: m.seg } })
}
</script>

<template>
  <div class="page" style="padding-bottom:140px">
    <div v-for="(m, k) in msgs" :key="k" :style="{ alignSelf: m.de === 'moi' ? 'flex-end' : 'flex-start', maxWidth: '86%' }">
      <div class="card" :style="m.de === 'moi' ? 'background:var(--accent);color:var(--accent-text);border-bottom-right-radius:4px' : 'border-bottom-left-radius:4px'">
        <div style="white-space:pre-line">{{ m.txt }}</div>
        <button v-if="m.source" class="pill" style="margin-top:10px" @click="ecouter(m)">🎧 Source : {{ m.source.titre }}</button>
        <div v-if="m.rdv" class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap">
          <button class="btn sm" :disabled="m.transmis" @click="transmettre(m)">{{ m.transmis ? '✓ Transmise' : 'Transmettre à un analyste' }}</button>
          <button class="btn sm secondary" @click="aller('rdv')">Réserver un analyste</button>
          <button class="btn sm secondary" @click="aller('bibliotheque')">Avis datés</button>
        </div>
        <button v-if="m.parcours" class="btn sm" style="margin-top:10px" @click="aller('parcours')">Ouvrir le parcours</button>
      </div>
    </div>
    <div v-if="reflechit" class="card muted" style="align-self:flex-start">Recherche dans les contenus EDB…</div>

    <div style="position:fixed;left:50%;transform:translateX(-50%);bottom:64px;width:100%;max-width:480px;padding:8px 12px;background:var(--bg)">
      <div class="chips" style="margin-bottom:8px">
        <button v-for="s in suggestions" :key="s" class="chip" @click="envoyer(s)">{{ s }}</button>
      </div>
      <form class="search" @submit.prevent="envoyer()">
        <input v-model="saisie" placeholder="Votre question sur la bourse…" aria-label="Question" />
        <button type="submit" class="strong" style="color:var(--accent)">Envoyer</button>
      </form>
    </div>
  </div>
</template>
