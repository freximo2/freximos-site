// Worker de contacto para freximos.com
// Ruta: freximos.com/api/contact (POST JSON)
// Secretos (wrangler secret put): RESEND_API_KEY, TURNSTILE_SECRET_KEY
// Variables (wrangler.toml): CONTACT_TO, CONTACT_FROM, ALLOWED_ORIGIN

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const LIMITS = { name: 100, email: 254, message: 2000 };

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

async function verifyTurnstile(token, ip, env) {
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET_KEY);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  return data.success === true;
}

async function sendEmail({ name, email, message }, env) {
  // Texto plano: el contenido del visitante nunca se interpreta como HTML
  const text = [
    `Nombre: ${name}`,
    `Correo: ${email}`,
    '',
    message,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `Nuevo contacto desde freximos.com: ${name}`,
      text,
    }),
  });
  if (!res.ok) {
    // Diagnóstico: código y mensaje de Resend, sin datos del visitante
    console.error('resend_error', res.status, await res.text());
  }
  return res.ok;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/contact') {
      return json({ error: 'not_found' }, 404);
    }
    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405);
    }

    // Solo acepta peticiones originadas en el sitio
    if (request.headers.get('Origin') !== env.ALLOWED_ORIGIN) {
      return json({ error: 'forbidden' }, 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid_json' }, 400);
    }

    // Campo trampa: los bots lo llenan, las personas no lo ven
    if (body.website) {
      return json({ ok: true });
    }

    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const message = String(body.message ?? '').trim();

    if (!name || name.length > LIMITS.name) return json({ error: 'invalid_name' }, 400);
    if (!EMAIL_RE.test(email) || email.length > LIMITS.email) return json({ error: 'invalid_email' }, 400);
    if (!message || message.length > LIMITS.message) return json({ error: 'invalid_message' }, 400);

    if (!body.turnstileToken) return json({ error: 'captcha_failed' }, 400);
    const human = await verifyTurnstile(body.turnstileToken, request.headers.get('CF-Connecting-IP'), env);
    if (!human) return json({ error: 'captcha_failed' }, 400);

    const sent = await sendEmail({ name, email, message }, env);
    if (!sent) return json({ error: 'send_failed' }, 502);

    return json({ ok: true });
  },
};
