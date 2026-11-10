# freximos-site

Sitio corporativo de **Freximos AI Systems** ([freximos.com](https://freximos.com)).

Sitio estático (HTML, CSS y JavaScript sin frameworks), con un formulario de contacto atendido por un Cloudflare Worker que envía los mensajes con Resend y verifica a cada visitante con Cloudflare Turnstile.

## Contenido

| Ruta | Qué es |
|---|---|
| `/` | Home: logo, servicios, ficha profesional |
| `/contacto` | Formulario de contacto |
| `/api/contact` | Endpoint del Worker (no es una página) |
| `eventos.freximos.com` | Página de mantenimiento (ver `maintenance/`) |

## Estructura

```
freximos-site/
├── public/        Sitio estático (se sirve tal cual)
│   ├── index.html, contacto.html, styles.css, contact.js
│   └── assets/    Logos y foto de perfil
├── maintenance/   Página "Próximamente" para los subdominios de eventos
├── worker/        Cloudflare Worker del formulario de contacto
├── infra/         Docker Compose y configuración de nginx
└── docs/          Documentación técnica
```

## Documentación

- [Arquitectura](docs/arquitectura.md): cómo se conectan las piezas.
- [Despliegue](docs/despliegue.md): cómo levantar, publicar y mover el sitio.
- [Formulario de contacto](docs/formulario-contacto.md): Turnstile, Worker y Resend, paso a paso.
- [Operaciones](docs/operaciones.md): caché, versiones de CSS, mantenimiento y rotación de secretos.
- [Seguridad](docs/seguridad.md): cabeceras, decisiones y pendientes.

## Inicio rápido

```bash
# Levantar el sitio en local (http://localhost:8081)
docker-compose -p freximos-site -f infra/docker-compose.yml up -d

# Probar el Worker (sin enviar correos reales)
cd worker && npm install && npm test
```

Los secretos nunca van en este repositorio. Ver [Formulario de contacto](docs/formulario-contacto.md#secretos).
