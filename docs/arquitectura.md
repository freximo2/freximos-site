# Arquitectura

```
Visitante
   │  HTTPS (certificado de Cloudflare)
   ▼
Cloudflare (DNS, proxy, caché, Turnstile, Worker)
   │
   ├── freximos.com/api/contact ──► Worker "freximos-contact"
   │                                  ├─ valida datos y origen
   │                                  ├─ verifica Turnstile (challenges.cloudflare.com)
   │                                  └─ envía correo por Resend (api.resend.com)
   │                                           └─► bandeja de contacto
   │
   └── resto de rutas ──► Cloudflare Tunnel (cloudflared, en el Mac)
                             └─► nginx (contenedor) ──► public/ o maintenance/
```

## Piezas

| Pieza | Dónde vive | Función |
|---|---|---|
| Sitio estático | `public/` | HTML, CSS y JS. Se sirve con nginx |
| nginx | `infra/nginx/site.conf` | Sirve archivos y añade cabeceras de seguridad |
| Docker Compose | `infra/docker-compose.yml` | Levanta nginx del sitio y de mantenimiento |
| Cloudflare Tunnel | `~/.cloudflared/config.yml` (fuera del repo) | Expone los puertos locales en el dominio |
| Worker | `worker/` | Procesa el formulario de contacto |
| Turnstile | Panel de Cloudflare | Verifica que el visitante es una persona |
| Resend | Panel de Resend | Entrega los correos y firma los envíos (DKIM, SPF) |

## Por qué así

- **Sin framework:** el sitio es pequeño y casi estático. Un framework añadiría complejidad sin beneficio.
- **Worker para el formulario:** la lógica sensible (claves, validación, envío) corre en Cloudflare y no en el navegador.
- **Túnel en lugar de servidor propio:** hoy el servicio corre en un Mac. El mismo diseño funciona en un VPS sin cambiar el código.
