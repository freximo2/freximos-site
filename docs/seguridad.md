# Seguridad

## Implementado

| Medida | Dónde |
|---|---|
| HTTPS de extremo a extremo | Cloudflare (certificado automático) |
| `X-Content-Type-Options: nosniff` | `infra/nginx/site.conf` |
| `X-Frame-Options: SAMEORIGIN` | `infra/nginx/site.conf` |
| `Referrer-Policy: strict-origin-when-cross-origin` | `infra/nginx/site.conf` |
| `Permissions-Policy` (cámara, micrófono y ubicación desactivados) | `infra/nginx/site.conf` |
| Verificación anti-bots (Turnstile) | Formulario y Worker |
| Origen restringido a `https://freximos.com` | Worker |
| Campo trampa (honeypot) | Formulario y Worker |
| Correo en texto plano (sin HTML del visitante) | Worker |
| Puertos locales solo en `127.0.0.1` | `infra/docker-compose.yml` |
| Secretos fuera del repo | Secretos del Worker y llavero |

## Pendiente

| Medida | Por qué | Cómo |
|---|---|---|
| **HSTS** | Evita conexiones HTTP en visitas futuras | Cloudflare → SSL/TLS → Edge Certificates → HSTS |
| **Always Use HTTPS** | Redirige HTTP a HTTPS | Cloudflare → SSL/TLS → Edge Certificates |
| **Content-Security-Policy** | Limita de dónde pueden cargar scripts | Requiere probarla con la protección de correo de Cloudflare |
| **Límite de frecuencia en el formulario** | Frena el spam masivo | Regla de Rate Limiting en Cloudflare para `/api/contact` |
| **Límite de tamaño del cuerpo** | Evita peticiones enormes al Worker | Validar `Content-Length` antes de leer el cuerpo |

## Decisiones

- **No hay base de datos ni cuentas en el sitio.** No hay datos personales almacenados, salvo los correos que llegan a la bandeja.
- **Los mensajes salen por Resend** y no por un servidor propio, para que la reputación de envío y la firma DKIM las gestione un proveedor especializado.
- **Sin dependencias de terceros en el frontend**, salvo Turnstile.
