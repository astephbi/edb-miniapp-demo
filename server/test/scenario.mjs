// Scénario complet contre le bot en local (wrangler dev) + faux Telegram
import crypto from 'node:crypto'

const BOT = 'http://127.0.0.1:8787'
const MOCK = 'http://127.0.0.1:8789'
const GROUP = -1003894736297
const TOKEN = '123:TESTTOKEN'
let uid = 1000
const sleep = ms => new Promise(r => setTimeout(r, ms))

const u = (id, first_name) => ({ id, is_bot: false, first_name })
const ADMIN = u(1, 'Alex'), AWA = u(2, 'Awa'), KOFFI = u(3, 'Koffi'), FATOU = u(4, 'Fatou')

async function upd (o) {
  const r = await fetch(BOT + '/telegram/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': 'secret-test' }, body: JSON.stringify({ update_id: uid++, ...o }) })
  if (r.status !== 200) throw new Error('webhook ' + r.status)
}
const dm = (from, text, extra = {}) => upd({ message: { message_id: uid, from, chat: { id: from.id, type: 'private' }, date: 0, text, ...extra } })
const cb = (from, data) => upd({ callback_query: { id: 'cb' + uid, from, data, chat_instance: 'x' } })
const join = from => upd({ chat_join_request: { chat: { id: GROUP, type: 'supergroup' }, from, user_chat_id: from.id, date: 0 } })
const calls = async () => (await fetch(MOCK + '/calls')).json()
const reset = () => fetch(MOCK + '/reset')

let fails = 0
function check (label, cond, detail = '') {
  console.log((cond ? '  ✅ ' : '  ❌ ') + label + (cond ? '' : '  → ' + detail))
  if (!cond) fails++
}
const txt = c => c.filter(x => x.method === 'sendMessage').map(x => x.body.text).join(' || ')
const has = (c, m, f = () => true) => c.some(x => x.method === m && f(x.body))

function initData (user) {
  const p = new URLSearchParams({ auth_date: String(Math.floor(Date.now() / 1000)), query_id: 'Q1', user: JSON.stringify(user) })
  const check = [...p.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n')
  const secret = crypto.createHmac('sha256', 'WebAppData').update(TOKEN).digest()
  p.set('hash', crypto.createHmac('sha256', secret).update(check).digest('hex'))
  return p.toString()
}
const apiCall = (path, user, opts = {}) => fetch(BOT + path, { ...opts, headers: { 'content-type': 'application/json', 'x-telegram-init-data': user ? initData(user) : '' } })

console.log('\n1. Installation (/setup)')
await reset()
let r = await fetch(BOT + '/setup?key=setup-test').then(r => r.json())
let c = await calls()
check('webhook, menu, commandes, permissions', r.webhook === 'ok' && r.permissions === 'ok', JSON.stringify(r))
check('les membres ne peuvent plus inviter', has(c, 'setChatPermissions', b => b.permissions.can_invite_users === false))
check('/setup refusé sans la clé', (await fetch(BOT + '/setup?key=faux')).status === 403)
check('webhook refusé sans le secret', (await fetch(BOT + '/telegram/webhook', { method: 'POST', body: '{}' })).status === 403)

console.log('\n2. Brice importe sa liste de payeurs')
await reset()
await dm(ADMIN, '/start')
await dm(ADMIN, '/import\ntelephone;nom;formule;fin\n07 07 07 07 07;Awa B.;trimestre;2026-11-08\n+225 0101010101;Yao K.;annee;2027-06-30\nligne cassée')
c = await calls()
check('2 payeurs importés, 1 ligne signalée', /2 payeur/.test(txt(c)) && /1 ligne/.test(txt(c)), txt(c))
await reset()
await dm(ADMIN, '/import', { document: { file_id: 'CSV1', file_name: 'liste.csv' }, caption: '/import', text: undefined })
c = await calls()
check('import par fichier .csv', /1 payeur/.test(txt(c)), txt(c))
await reset()
await dm(KOFFI, '/import')
check('un simple membre ne peut pas importer', /réservée aux administrateurs/.test(txt(await calls())))

console.log('\n3. Awa, déjà abonnée, retrouve son abonnement avec son numéro')
await reset()
await dm(AWA, '/start')
c = await calls()
check('accueil + demande du numéro', /Je suis l'assistant/.test(txt(c)) && has(c, 'sendMessage', b => b.reply_markup?.keyboard?.[0]?.[0]?.request_contact))
await reset()
await dm(AWA, undefined, { contact: { phone_number: '+2250707070707', first_name: 'Awa', user_id: 2 } })
c = await calls()
check('abonnement retrouvé jusqu\'au 8 novembre', /retrouvé.*8 novembre 2026/.test(txt(c)), txt(c))
check('bouton pour rejoindre le groupe', has(c, 'sendMessage', b => JSON.stringify(b.reply_markup || {}).includes('rejoindre')))
await reset()
await dm(FATOU, undefined, { contact: { phone_number: '+2250707070707', first_name: 'Awa', user_id: 2 } })
check('impossible de partager le numéro de quelqu\'un d\'autre', /propre numéro/.test(txt(await calls())))

console.log('\n4. Awa demande à rejoindre → acceptée automatiquement + bienvenue')
await reset()
await join(AWA)
c = await calls()
check('demande approuvée', has(c, 'approveChatJoinRequest', b => b.user_id === 2))
check('message de bienvenue personnalisé', /Bienvenue dans EDB Assistance/.test(txt(c)) && /8 novembre 2026/.test(txt(c)), txt(c))
check('bouton « Ce que j\'ai manqué »', has(c, 'sendMessage', b => JSON.stringify(b.reply_markup || {}).includes('#bienvenue')))

console.log('\n5. Koffi, sans abonnement : refusé, paie, puis entre')
await reset()
await join(KOFFI)
c = await calls()
check('demande refusée', has(c, 'declineChatJoinRequest', b => b.user_id === 3))
check('message expliquant comment s\'abonner', /pas pu être acceptée/.test(txt(c)))
await reset()
await dm(KOFFI, '/start')
await cb(KOFFI, 'pay:trimestre')
c = await calls()
check('reçu de paiement (mode test)', /Paiement reçu/.test(txt(c)) && /20 000 F/.test(txt(c)) && /1 février 2027/.test(txt(c)), txt(c))
check('lien d\'invitation personnel avec validation', has(c, 'createChatInviteLink', b => b.creates_join_request === true))
await reset()
await join(KOFFI)
check('nouvelle demande acceptée', has(await calls(), 'approveChatJoinRequest', b => b.user_id === 3))

console.log('\n6. Renouvellement anticipé : les jours ne sont pas perdus')
await reset()
await cb(KOFFI, 'pay:annee')
c = await calls()
check('nouvelle fin = 1 février 2028 (à la suite de l\'abonnement en cours)', /1 février 2028/.test(txt(c)), txt(c))
check('pas de nouveau lien (déjà dans le groupe)', !has(c, 'createChatInviteLink'))

console.log('\n7. Rappels et retrait automatique (simulation de dates)')
for (const [date, attendu, label] of [
  ['2026-11-02', /J-7 : 1/, 'J-7 envoyé à Awa (fin le 8)'],
  ['2026-11-02', /J-7 : 0/, 'pas de doublon si on relance le même jour'],
  ['2026-11-07', /J-1 : 1/, 'J-1 envoyé la veille'],
  ['2026-11-10', /expiration : 1/, 'avis d\'expiration + délai de grâce'],
  ['2026-11-13', /expiration : 0/, 'rien pendant la grâce'],
  ['2026-11-14', /Retraits du groupe : 1/, 'retrait au 6e jour']
]) {
  await reset()
  await dm(ADMIN, '/cron ' + date)
  c = await calls()
  check(label, attendu.test(txt(c)), txt(c))
  if (/Retraits/.test(label)) {
    check('retrait = bannir puis débannir (peut revenir)', has(c, 'banChatMember', b => b.user_id === 2) && has(c, 'unbanChatMember', b => b.user_id === 2 && b.only_if_banned))
    check('Awa est prévenue', /retiré du groupe/.test(txt(c)))
  }
}
console.log('\n8. Contenus postés dans les salons fermés')
await reset()
await upd({ message: { message_id: 501, message_thread_id: 8, is_topic_message: true, from: ADMIN, chat: { id: GROUP, type: 'supergroup' }, date: 0, voice: { file_id: 'V1', duration: 600, file_size: 900000 }, caption: 'ETUDE NSIA BANQUE & NESTLE CI\nCoach démo' } })
await upd({ message: { message_id: 502, message_thread_id: 9, is_topic_message: true, from: ADMIN, chat: { id: GROUP, type: 'supergroup' }, date: 0, text: 'AVIS DATÉ — valeurs de rente\nNe constitue pas un conseil personnalisé.' } })
await upd({ message: { message_id: 503, message_thread_id: 2, is_topic_message: true, from: KOFFI, chat: { id: GROUP, type: 'supergroup' }, date: 0, text: 'message ordinaire dans le salon des traders' } })

console.log('\n9. API de la Mini App (signature Telegram)')
let me = await apiCall('/api/me', KOFFI).then(r => r.json())
check('statut actif renvoyé à l\'app', me.statut === 'actif' && me.fin === '2028-02-01', JSON.stringify(me))
check('requête sans signature refusée', (await apiCall('/api/me', null)).status === 401)
const bad = initData(KOFFI).replace(/hash=[0-9a-f]{4}/, 'hash=0000')
check('signature falsifiée refusée', (await fetch(BOT + '/api/me', { headers: { 'x-telegram-init-data': bad } })).status === 401)
let cont = await apiCall('/api/contenus?q=NSIA', KOFFI).then(r => r.json())
check('recherche dans la bibliothèque', Array.isArray(cont) && cont.length === 1 && /NSIA/.test(cont[0].titre), JSON.stringify(cont))
let all = await apiCall('/api/contenus', KOFFI).then(r => r.json())
check('seuls les salons fermés sont indexés (2 contenus)', all.length === 2, JSON.stringify(all))
check('contenu refusé à un non-abonné', (await apiCall('/api/contenus', FATOU)).status === 403)
await reset()
let pay = await apiCall('/api/pay', FATOU, { method: 'POST', body: JSON.stringify({ formule: 'trimestre', moyen: 'Wave' }) }).then(r => r.json())
c = await calls()
check('paiement depuis l\'app + reçu dans Telegram', pay.ref && /Paiement reçu/.test(txt(c)), JSON.stringify(pay))
check('formule inconnue refusée', (await apiCall('/api/pay', FATOU, { method: 'POST', body: JSON.stringify({ formule: 'gratuit' }) })).status === 400)

console.log('\n10. Tableau de bord et annonce')
await reset()
await dm(ADMIN, '/stats')
c = await calls()
check('stats', /À jour : 3/.test(txt(c)) && /Encaissé ce mois : 1[0-9 ]+F/.test(txt(c)) && /Contenus indexés : 2/.test(txt(c)), txt(c))
await reset()
await dm(ADMIN, '/annonce Étude en direct dimanche à 17 h')
c = await calls()
check('annonce dans le groupe + en privé', has(c, 'sendMessage', b => b.chat_id === GROUP) && /envoyée en privé à 3/.test(txt(c)), txt(c))

console.log(fails ? `\n❌ ${fails} échec(s)` : '\n✅ Tous les tests passent')
process.exit(fails ? 1 : 0)
