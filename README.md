# Juego de Palabras

Juego web que consulta definiciones del DLE/RAE, Wiktionary y Elhuyar mediante APIs propias en Cloudflare Pages Functions.

## Requisitos

- Node.js 20 o superior.
- npm.
- Python 3, solo si quieres servir el frontend sin instalar Node.
- Cuenta de Cloudflare, solo para desplegar con Wrangler.

## Estructura

- `public/`: frontend del juego.
- `functions/`: funciones de Cloudflare Pages para `/api/rae/...`, `/api/en/...` y `/api/eu/...`.
- `server.js`: servidor Express heredado para correrlo como app Node tradicional.

## Primer setup

Desde tu terminal:

```bash
cd "/Users/josegustavochico/Library/CloudStorage/GoogleDrive-josegustavochico@gmail.com/Mi unidad/_ProjectVault/_Games/_Finished/_poemas/JuegoDePalabras/JuegoDePalabras_Node"
npm install
```

## Desarrollo local: recomendado

Usa Wrangler para emular Cloudflare Pages localmente. Esta es la forma mas parecida al deploy real porque sirve `public/` y tambien las Pages Functions de `functions/`.

```bash
cd "/Users/josegustavochico/Library/CloudStorage/GoogleDrive-josegustavochico@gmail.com/Mi unidad/_ProjectVault/_Games/_Finished/_poemas/JuegoDePalabras/JuegoDePalabras_Node"
npm install
npm run dev
```

Abre la URL que muestre Wrangler. Normalmente sera:

```text
http://localhost:8788
```

Rutas utiles para probar las APIs locales:

```text
http://localhost:8788/api/rae/search/casa
http://localhost:8788/api/en/search/game
http://localhost:8788/api/eu/search/etxea
```

## Desarrollo local: frontend con API desplegada

No requiere instalar dependencias de Node. Sirve solo el frontend local y usa la API de Cloudflare Pages ya desplegada.

```bash
cd "/Users/josegustavochico/Library/CloudStorage/GoogleDrive-josegustavochico@gmail.com/Mi unidad/_ProjectVault/_Games/_Finished/_poemas/JuegoDePalabras/JuegoDePalabras_Node/public"
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
http://localhost:8000?api=https://juego-de-palabras.pages.dev&lang=eu
```

## Desarrollo local: Express heredado

Tambien existe un servidor Express antiguo. Sirve el frontend y algunas rutas API desde `server.js`.

```bash
cd "/Users/josegustavochico/Library/CloudStorage/GoogleDrive-josegustavochico@gmail.com/Mi unidad/_ProjectVault/_Games/_Finished/_poemas/JuegoDePalabras/JuegoDePalabras_Node"
npm install
npm start
```

Abre:

```text
http://localhost:3000
```

Si quieres otro puerto:

```bash
cd "/Users/josegustavochico/Library/CloudStorage/GoogleDrive-josegustavochico@gmail.com/Mi unidad/_ProjectVault/_Games/_Finished/_poemas/JuegoDePalabras/JuegoDePalabras_Node"
PORT=3001 npm start
```

## Build

Este proyecto no tiene paso de build. Cloudflare Pages publica directamente la carpeta `public/` y carga las funciones desde `functions/`.

Comando rapido para comprobar que el servidor Node no tiene errores de sintaxis:

```bash
cd "/Users/josegustavochico/Library/CloudStorage/GoogleDrive-josegustavochico@gmail.com/Mi unidad/_ProjectVault/_Games/_Finished/_poemas/JuegoDePalabras/JuegoDePalabras_Node"
npm test
```

## Deploy en Cloudflare Pages por CLI

Si todavia no has iniciado sesion en Cloudflare:

```bash
cd "/Users/josegustavochico/Library/CloudStorage/GoogleDrive-josegustavochico@gmail.com/Mi unidad/_ProjectVault/_Games/_Finished/_poemas/JuegoDePalabras/JuegoDePalabras_Node"
npx wrangler login
```

Despliega:

```bash
cd "/Users/josegustavochico/Library/CloudStorage/GoogleDrive-josegustavochico@gmail.com/Mi unidad/_ProjectVault/_Games/_Finished/_poemas/JuegoDePalabras/JuegoDePalabras_Node"
npm install
npm run deploy
```

## Configuracion de Cloudflare Pages

Si configuras el proyecto desde el dashboard de Cloudflare Pages:

- Root directory: `/`
- Framework preset: `None`
- Build command: dejar vacio
- Build output directory: `public`
- Node version: `20` o superior

`wrangler.toml` ya contiene:

```toml
name = "juego-de-palabras"
compatibility_date = "2026-04-17"
pages_build_output_dir = "public"
```

## Rutas API

```text
GET /api/rae/search/:word
GET /api/en/search/:word
GET /api/eu/search/:word
```

La ruta de espanol consulta DLE/RAE, la ruta de ingles consulta Wiktionary y la ruta de euskera usa Elhuyar Hiztegia a traves del formulario publico de Euskadi.eus. Las respuestas se normalizan al formato que espera el juego:

```json
{
  "definitions": []
}
```

## Comandos rapidos

```bash
cd "/Users/josegustavochico/Library/CloudStorage/GoogleDrive-josegustavochico@gmail.com/Mi unidad/_ProjectVault/_Games/_Finished/_poemas/JuegoDePalabras/JuegoDePalabras_Node"
npm install
npm run dev
```

```bash
cd "/Users/josegustavochico/Library/CloudStorage/GoogleDrive-josegustavochico@gmail.com/Mi unidad/_ProjectVault/_Games/_Finished/_poemas/JuegoDePalabras/JuegoDePalabras_Node"
npm test
```

```bash
cd "/Users/josegustavochico/Library/CloudStorage/GoogleDrive-josegustavochico@gmail.com/Mi unidad/_ProjectVault/_Games/_Finished/_poemas/JuegoDePalabras/JuegoDePalabras_Node"
npm run deploy
```

```bash
cd "/Users/josegustavochico/Library/CloudStorage/GoogleDrive-josegustavochico@gmail.com/Mi unidad/_ProjectVault/_Games/_Finished/_poemas/JuegoDePalabras/JuegoDePalabras_Node/public"
python3 -m http.server 8000
```

## Troubleshooting

- Si `npm run dev` falla por version de Node, revisa `node --version` y usa Node 20 o superior.
- Si Wrangler pide login, ejecuta `npx wrangler login`.
- Si el frontend local con Python no encuentra la API, confirma que abriste la URL con `?api=https://juego-de-palabras.pages.dev`.
- Si una palabra no devuelve definiciones, prueba directamente la ruta API correspondiente para ver si el problema esta en la fuente externa o en el frontend.
