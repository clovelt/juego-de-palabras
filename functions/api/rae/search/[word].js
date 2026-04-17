const BASE_URL = "https://dle.rae.es/data/";
const AUTH = "Basic cDY4MkpnaFMzOmFHZlVkQ2lFNDM0";

const RAE_HEADERS = {
  "User-Agent": "Diccionario/2 CFNetwork/808.2.16 Darwin/16.3.0",
  "Content-Type": "application/x-www-form-urlencoded",
  Authorization: AUTH,
};

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { headers: JSON_HEADERS });
}

export async function onRequestGet({ params }) {
  const word = params.word;

  if (!word) {
    return json({ error: "Missing word" }, 400);
  }

  try {
    const search = await requestRae(`search?w=${encodeURIComponent(word)}`);
    const firstResult = search.res && search.res[0];

    if (!firstResult || !firstResult.id) {
      return json({ definitions: [] });
    }

    const fetchedWord = await fetchWord(firstResult.id);
    return json({ definitions: fetchedWord.definitions.map((def) => def.definition) });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

async function fetchWord(id) {
  const body = await requestRaeText(`fetch?id=${encodeURIComponent(id)}`);
  const cleanedBody = normalizeRaeBody(body);

  if (/^<abbr title="V&#xE9;ase"/.test(cleanedBody)) {
    const seeAlsoId = cleanedBody.match(/id="(\w+)"/)?.[1];
    if (seeAlsoId) {
      return fetchWord(seeAlsoId);
    }
  }

  if (/^<article id=".*">/.test(cleanedBody)) {
    return { definitions: extractDefinitions(cleanedBody) };
  }

  if (cleanedBody.startsWith("{")) {
    return JSON.parse(cleanedBody);
  }

  return { definitions: extractDefinitions(cleanedBody) };
}

async function requestRae(endpoint) {
  return JSON.parse(normalizeRaeBody(await requestRaeText(endpoint)));
}

async function requestRaeText(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, { headers: RAE_HEADERS });

  if (!response.ok) {
    throw new Error(`RAE responded with ${response.status}`);
  }

  const body = await response.text();

  if (!body) {
    throw new Error("RAE returned an empty response");
  }

  return body;
}

function normalizeRaeBody(body) {
  let normalized = body.replace(/\n/g, "").replace(/\t/g, "");

  if (normalized.includes("json(")) {
    normalized = normalized.slice(5, -1);
  }

  if (normalized.includes("jsonp123(")) {
    normalized = normalized.slice(9, -1);
  }

  return normalized.replace(/<sup>\d+<\\\/sup>/g, "");
}

function extractDefinitions(html) {
  const definitions = [];
  const paragraphs = html.matchAll(/<p class="j\d?"[^>]*>(.+?)(?=<\/p>)/g);

  for (const paragraph of paragraphs) {
    const content = paragraph[1];
    const abbr = content.match(/<abbr[^>]*>(.+?)(?=<\/abbr>)/);

    definitions.push({
      type: decodeHtml(abbr?.[0]?.match(/title="(.+)">/)?.[1] || ""),
      definition: decodeHtml(
        content
          .replace(/<abbr[^>]+>.+?<\/abbr>/, "")
          .replace(/<span class="h">.+<\/span>/g, "")
          .replace(/<span class="n_acep">\S+ <\/span>/g, "")
          .replace(/<[^>]+>/g, "")
          .replace("sing.", "singular")
          .replace("pl.", "plural")
          .replace("t.", "también")
          .replace("p.", "poco")
          .trim(),
      ),
    });
  }

  return definitions;
}

function decodeHtml(value) {
  return value
    .replace(/&#xE1;/g, "á")
    .replace(/&#xE9;/g, "é")
    .replace(/&#xED;/g, "í")
    .replace(/&#xF3;/g, "ó")
    .replace(/&#xFA;/g, "ú")
    .replace(/&#xF1;/g, "ñ")
    .replace(/&#x2016;/g, "||")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}
