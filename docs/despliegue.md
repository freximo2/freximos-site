# Despliegue

## 1. Sitio (nginx en Docker)

Requisitos: Docker (o Colima en macOS) y `docker-compose`.

```bash
# Desde la raíz del repo
docker-compose -p freximos-site -f infra/docker-compose.yml up -d

# Recrear contenedores después de cambiar nginx o el compose
docker-compose -p freximos-site -f infra/docker-compose.yml up -d --force-recreate
```

Los puertos están limitados a `127.0.0.1`:

| Servicio | Puerto local | Ruta |
|---|---|---|
| Sitio | 8081 | `public/` |
| Mantenimiento | 8083 | `maintenance/` |

> El nombre de proyecto `-p freximos-site` es importante: mantiene los mismos contenedores y evita duplicar puertos.

## 2. Túnel de Cloudflare (exponer al dominio)

Ver `~/.cloudflared/config.yml`. Ejemplo sin datos sensibles en [`infra/cloudflared.example.yml`](../infra/cloudflared.example.yml).

```bash
cloudflared tunnel --config ~/.cloudflared/config.yml run freximos
```

Tras cambiar el `config.yml`, reinicia el túnel. Cada hostname necesita su registro DNS (`cloudflared tunnel route dns <tunnel> <hostname>`).

## 3. Worker del formulario

```bash
cd worker
npx wrangler login
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler deploy
```

Las variables no secretas están en `worker/wrangler.toml`.

## 4. Caché

Cloudflare guarda archivos estáticos hasta 4 horas. Después de cambiar CSS o imágenes:
- Sube el parámetro de versión en el HTML (`styles.css?v=N`), o
- Purga la caché en **Caching → Configuration → Purge Everything**.

## Pasar a un VPS (futuro)

1. Instalar Docker y `cloudflared` en el servidor.
2. Copiar `infra/`, `public/`, `maintenance/` y el `config.yml` con las credenciales del túnel.
3. Levantar el mismo compose y arrancar el túnel allí.
4. Apagar el túnel del Mac para evitar dos conexiones.

El Worker no cambia: vive en Cloudflare, no en el servidor.
