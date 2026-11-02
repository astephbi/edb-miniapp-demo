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

console.log('\n11. Le 14 novembre (date simulée) : Awa a été retirée')
await reset()
await join(AWA)
check('Awa expirée ne peut plus rentrer', has(await calls(), 'declineChatJoinRequest', b => b.user_id === 2))
await reset()
await cb(AWA, 'pay:trimestre')
let c = await calls()
check('Awa paie → nouveau lien pour revenir', /Paiement reçu/.test(txt(c)) && has(c, 'createChatInviteLink'))


console.log(fails ? `\n❌ ${fails} échec(s)` : '\n✅ Tous les tests passent')
process.exit(fails ? 1 : 0)
