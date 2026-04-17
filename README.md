# Juego de Palabras

Juego web que consulta definiciones del DLE/RAE mediante una API propia.

## Estructura

- `public/`: frontend del juego.
- `functions/`: funciones de Cloudflare Pages para `/api/rae/...`.
- `server.js`: servidor Express heredado para correrlo como app Node tradicional.

## Desarrollo local

Hay dos formas de probar el proyecto.

### Frontend local + API desplegada

No requiere instalar dependencias de Node. Sirve solo el frontend local y usa la API de Cloudflare Pages:

```bash
cd public
python3 -m http.server 8000
```

Abre:

```text
http://localhost:8000?api=https://juego-de-palabras.pages.dev
```

Puedes forzar idioma:

```text
http://localhost:8000?api=https://juego-de-palabras.pages.dev&lang=es
http://localhost:8000?api=https://juego-de-palabras.pages.dev&lang=en
```

### Cloudflare Pages local

Requiere Node 20 o superior para usar Wrangler. Emula frontend y funciones en local:

```bash
npm install
npm run dev
```

Abre la URL que muestre Wrangler, normalmente:

```text
http://localhost:8788
```

## Deploy en Cloudflare Pages

Configura el proyecto con:

- Root directory: `/`
- Framework preset: `None`
- Build command: vacio
- Build output directory: `public`
- Node version: `20` o superior

Las rutas `/api/rae/search/:word` y `/api/en/search/:word` se sirven desde Cloudflare Pages Functions.

## Deploy por CLI

```bash
npm install
npm run deploy
```
