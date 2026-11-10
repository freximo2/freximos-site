// Envío del formulario de contacto a /api/contact (Cloudflare Worker)
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');
  const button = form.querySelector('.form-submit');

  const MESSAGES = {
    invalid_name: 'Revisa tu nombre.',
    invalid_email: 'Revisa tu correo.',
    invalid_message: 'Escribe un mensaje.',
    captcha_failed: 'La verificación no fue válida. Intenta de nuevo.',
    send_failed: 'No pudimos enviar el mensaje. Intenta más tarde.',
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const turnstileToken = data.get('cf-turnstile-response');

    if (!turnstileToken) {
      status.textContent = 'Completa la verificación antes de enviar.';
      return;
    }

    button.disabled = true;
    status.textContent = 'Enviando…';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message'),
          website: data.get('website'),
          turnstileToken,
        }),
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        status.textContent = 'Gracias. Te responderemos pronto.';
        form.reset();
      } else {
        status.textContent = MESSAGES[result.error] || 'No pudimos enviar el mensaje. Intenta de nuevo.';
      }
    } catch {
      status.textContent = 'Error de conexión. Intenta de nuevo.';
    } finally {
      button.disabled = false;
      if (window.turnstile) window.turnstile.reset();
    }
  });
})();
