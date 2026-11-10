# Operaciones

## Cambiar estilos o imágenes

El navegador y Cloudflare guardan archivos estáticos. Cuando cambies `styles.css` o un logo:

1. Sube la versión en el HTML: `styles.css?v=N` (sube N en cada cambio).
2. Si la imagen cambió, purga la caché en Cloudflare o cambia su nombre.

## Activar o desactivar la página de mantenimiento

Los subdominios de eventos apuntan a `maintenance/` mientras la plataforma está en pausa. Para cambiarlo, edita el puerto en `~/.cloudflared/config.yml` y reinicia el túnel:

- `8083` → página de mantenimiento.
- `8082` → producción de eventos (cuando esté activa).

## Rotar secretos

| Qué | Pasos |
|---|---|
| Clave de Resend | Crear una nueva en Resend → `wrangler secret put RESEND_API_KEY` → revocar la anterior |
| Secret de Turnstile | Rotar en el widget → guardar en el llavero → `wrangler secret put TURNSTILE_SECRET_KEY` |
| Token de API de Cloudflare | Crear uno nuevo con permisos mínimos → revocar el anterior |

Si una clave se compartió fuera de un gestor de secretos, rótala aunque no haya indicios de uso indebido.

## Revisar el estado

```bash
# Contenedores del sitio
docker ps --filter name=freximos-site

# Logs del Worker
cd worker && npx wrangler tail freximos-contact

# Healthcheck rápido
curl -sI https://freximos.com | head -1
```

## Cambios en el repositorio

- Trabaja en `main`, con commits pequeños y mensajes claros (`feat:`, `fix:`, `style:`, `docs:`).
- Antes de subir, revisa que no haya claves: `git diff --cached | grep -E "re_|cfat_|BEGIN"`.
