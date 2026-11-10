# Formulario de contacto

Flujo completo, desde que el visitante escribe hasta que llega el correo.

```
1. Usuario llena el formulario (/contacto)
2. Turnstile genera un token invisible para el navegador
3. contact.js envía POST /api/contact con { name, email, message, website, turnstileToken }
4. Worker:
   a. rechaza orígenes distintos de https://freximos.com        → 403
   b. rechaza JSON inválido                                      → 400
   c. si el campo "website" trae texto (trampa anti-bots)        → 200 sin enviar
   d. valida nombre, correo (formato) y mensaje (longitud)       → 400
   e. verifica el token con Turnstile (servidor a servidor)      → 400 si falla
   f. envía el correo con Resend                                 → 502 si falla
   g. responde 200
5. Correo llega a fredy.olarte.ia@outlook.com
   Responder a: correo del visitante
```

## Códigos de error

| Código | Clave (`error`) | Causa |
|---|---|---|
| 400 | `invalid_name`, `invalid_email`, `invalid_message` | Campo vacío o fuera de límites |
| 400 | `captcha_failed` | Turnstile no validó |
| 403 | `forbidden` | La petición no viene de `freximos.com` |
| 502 | `send_failed` | Resend rechazó el envío (ver "Solución de problemas") |

## Configuración

### Turnstile (verificación anti-bots)

1. Panel de Cloudflare → **Turnstile → Add widget**.
2. Modo `managed`, dominios `freximos.com` y `www.freximos.com`.
3. La **site key** es pública y va en el HTML:
   ```html
   <div class="cf-turnstile" data-sitekey="..."></div>
   ```
   Está en `public/index.html` y `public/contacto.html`.
4. La **secret key** es privada y va solo como secreto del Worker (ver [Secretos](#secretos)).

### Resend (envío de correos)

1. Cuenta en [resend.com](https://resend.com) y API key con permiso de envío.
2. **Domains → Add Domain → `freximos.com`**. Resend muestra estos registros, que se crean en Cloudflare **sin proxy**:

   | Tipo | Nombre | Función |
   |---|---|---|
   | TXT | `resend._domainkey` | Firma DKIM |
   | MX | `send` | Recepción de rebotes |
   | TXT | `send` | SPF |
   | CNAME | `rsend` | Seguimiento de envíos |

   Los valores exactos los genera Resend para cada cuenta.
3. Pulsar **Verify**. Hasta que el dominio esté verificado, Resend solo envía a la dirección de la cuenta.
4. Remitente configurado: `Freximos <contacto@freximos.com>`.

> **Modo de prueba:** con `onboarding@resend.dev` como remitente, Resend solo entrega al correo de la cuenta. Sirve para pruebas, no para producción.

### Variables del Worker (`worker/wrangler.toml`)

| Variable | Valor | Descripción |
|---|---|---|
| `CONTACT_TO` | correo de destino | Donde llegan los mensajes |
| `CONTACT_FROM` | `Freximos <contacto@freximos.com>` | Remitente (debe ser de un dominio verificado) |
| `ALLOWED_ORIGIN` | `https://freximos.com` | Único origen permitido |

## Secretos

| Secreto | Dónde se guarda | Cómo se carga |
|---|---|---|
| `RESEND_API_KEY` | Worker de Cloudflare | `npx wrangler secret put RESEND_API_KEY` |
| `TURNSTILE_SECRET_KEY` | Worker de Cloudflare | `npx wrangler secret put TURNSTILE_SECRET_KEY` |

Copia local de respaldo de la secret de Turnstile: llavero de macOS, servicio `freximos-turnstile-secret`.

Recuperar el valor del llavero sin mostrarlo en pantalla:

```bash
security find-generic-password -s freximos-turnstile-secret -a freximos -w | npx wrangler secret put TURNSTILE_SECRET_KEY
```

Nunca pegues claves en el chat, en issues ni en commits.

## Pruebas

```bash
cd worker && npm test
```

Las pruebas simulan Turnstile y Resend. Cubren orígenes, validaciones, honeypot, fallo de Turnstile y el contenido del correo.

Prueba real en vivo: envía el formulario desde `https://freximos.com/contacto` y revisa el correo.

Para ver errores del Worker en tiempo real:

```bash
cd worker && npx wrangler tail freximos-contact
```

## Solución de problemas

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| "No pudimos enviar el mensaje" | `send_failed` (502) | Revisa `wrangler tail`. Si aparece `validation_error` con "only send testing emails", el dominio no está verificado |
| "La verificación no fue válida" | Turnstile rechazó el token | Revisa que la secret del Worker corresponda a la site key del HTML |
| 404 en `/api/contact` | El Worker no está desplegado o la ruta no coincide | `npx wrangler deploy` y revisa la ruta en `wrangler.toml` |
| "Invalid sitekey" en el formulario | Site key incorrecta o sin dominio autorizado | Revisa la site key y los hostnames del widget |
