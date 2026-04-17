# Juego de Palabras

Juego web que consulta definiciones del DLE/RAE mediante una API propia.

## Estructura

- `public/`: frontend del juego.
- `functions/`: funciones de Cloudflare Pages para `/api/rae/...`.
- `server.js`: servidor Express heredado para correrlo como app Node tradicional.

## Desarrollo

Requiere Node 20 o superior para usar Wrangler.

```bash
npm install
npm run dev
```

## Deploy en Cloudflare Pages

Configura el proyecto con:

- Root directory: `/`
- Framework preset: `None`
- Build command: vacio
- Build output directory: `public`
- Node version: `20` o superior

La ruta `/api/rae/search/:word` se sirve desde Cloudflare Pages Functions.

## Deploy por CLI

```bash
npm install
npm run deploy
```
