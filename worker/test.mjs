// Pruebas locales del Worker con fetch simulado (no envía correos reales)
// Uso: node worker/test.mjs
import worker from './src/index.js';

const env = {
  RESEND_API_KEY: 'test_resend',
  TURNSTILE_SECRET_KEY: 'test_turnstile',
  CONTACT_TO: 'destino@example.com',
  CONTACT_FROM: 'Freximos <contacto@example.com>',
  ALLOWED_ORIGIN: 'https://freximos.com',
};

let sentEmails = [];
let turnstileOk = true;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (String(url).includes('challenges.cloudflare.com')) {
    return new Response(JSON.stringify({ success: turnstileOk }), { status: 200 });
  }
  if (String(url).includes('api.resend.com')) {
    sentEmails.push(JSON.parse(opts.body));
    return new Response('{}', { status: 200 });
  }
  return realFetch(url, opts);
};

const req = (body, headers = {}) =>
  new Request('https://freximos.com/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://freximos.com', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const valid = {
  name: 'Ana Pérez',
  email: 'ana@empresa.co',
  message: 'Necesitamos migrar a Kubernetes.',
  turnstileToken: 'tok',
};

const cases = [
  ['origen ajeno → 403', req(valid, { Origin: 'https://otro.com' }), 403],
  ['JSON inválido → 400', req('{no json'), 400],
  ['nombre vacío → 400', req({ ...valid, name: '  ' }), 400],
  ['correo inválido → 400', req({ ...valid, email: 'no-es-correo' }), 400],
  ['mensaje vacío → 400', req({ ...valid, message: '' }), 400],
  ['sin token Turnstile → 400', req({ ...valid, turnstileToken: '' }), 400],
  ['Turnstile falla → 400', req(valid), 400, () => (turnstileOk = false)],
  ['honeypot lleno → 200 sin enviar', req({ ...valid, website: 'spam' }), 200],
  ['envío válido → 200', req(valid), 200, () => (turnstileOk = true)],
];

let failed = 0;
for (const [name, request, expected, setup] of cases) {
  if (setup) setup();
  sentEmails = [];
  const res = await worker.fetch(request, env);
  const honeypot = name.startsWith('honeypot');
  const ok = res.status === expected && (!honeypot || sentEmails.length === 0);
  if (!ok) failed++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} (status ${res.status})`);
}

// Comprobación del contenido del correo enviado
sentEmails = [];
turnstileOk = true;
await worker.fetch(req(valid), env);
const mail = sentEmails[0];
const contentOk =
  mail?.to?.[0] === env.CONTACT_TO &&
  mail?.reply_to === valid.email &&
  mail?.text.includes(valid.message) &&
  mail?.subject.includes(valid.name);
if (!contentOk) failed++;
console.log(`${contentOk ? 'OK  ' : 'FAIL'} contenido del correo (reply_to y destino)`);

console.log(failed === 0 ? '\nTodas las pruebas pasaron.' : `\n${failed} prueba(s) fallaron.`);
process.exit(failed === 0 ? 0 : 1);
