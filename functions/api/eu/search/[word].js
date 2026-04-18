const EEH_SEARCH_URL = "https://www.ehu.eus/eeh/cgi/bila";

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
    for (const term of buildSearchTerms(word)) {
      const html = await requestEeh(term);
      const definitions = extractDefinitions(html, term);

      if (definitions.length > 0) {
        return json({ definitions });
      }
    }

    return json({ definitions: [] });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

function buildSearchTerms(word) {
  const normalized = word.toLowerCase();
  const terms = [normalized];
  const add = (term) => {
    if (term && term.length >= 3) {
      terms.push(term);
    }
  };

  if (normalized.endsWith("ak")) {
    add(normalized.slice(0, -1));
    add(normalized.slice(0, -2));
  }

  if (normalized.endsWith("ek")) {
    add(normalized.slice(0, -1));
    add(normalized.slice(0, -2));
  }

  if (normalized.endsWith("a")) {
    add(normalized.slice(0, -1));
  }

  if (normalized.endsWith("tzeko")) {
    const stem = normalized.slice(0, -5);
    add(`${stem}tu`);
    add(`${stem}du`);
    add(stem);
  }

  if (normalized.endsWith("teko")) {
    const stem = normalized.slice(0, -4);
    add(`${stem}tu`);
    add(stem);
  }

  for (const suffix of ["etan", "etara", "etatik", "arekin", "aren", "ari", "ean", "en", "ko", "ra", "tik", "tan", "an"]) {
    if (normalized.endsWith(suffix)) {
      add(normalized.slice(0, -suffix.length));
    }
  }

  return unique(terms);
}

async function requestEeh(term) {
  const url = new URL(EEH_SEARCH_URL);
  url.searchParams.set("z", term);

  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "JuegoDePalabras/1.0 (https://juego-de-palabras.pages.dev)",
    },
  });

  if (!response.ok) {
    throw new Error(`EEH responded with ${response.status}`);
  }

  return response.text();
}

function extractDefinitions(html, requestedTerm) {
  const rows = [...html.matchAll(/<tr>\s*<td\s+class=["']eehE["'][^>]*>([\s\S]*?)<\/td>\s*<td\s+class=["']eeh["'][^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi)];
  const definitions = [];
  let isCollectingEntry = false;
  let foundEntry = false;

  for (const [, rawEntry, rawDefinition] of rows) {
    const entry = cleanText(rawEntry);
    const definition = cleanText(rawDefinition);

    if (!definition) {
      continue;
    }

    if (entry) {
      if (entryMatches(entry, requestedTerm)) {
        isCollectingEntry = true;
        foundEntry = true;
      } else if (foundEntry) {
        break;
      } else {
        isCollectingEntry = false;
      }
    }

    if (isCollectingEntry) {
      definitions.push(removeEehSenseNumber(definition));
    }
  }

  return unique(definitions).slice(0, 12);
}

function removeEehSenseNumber(definition) {
  return definition
    .replace(/^\d+[a-z]?\s+/u, "")
    .replace(/^((?:\p{L}+(?:,\s*)?)+)\s+\d+[a-z]?\s+/u, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

function entryMatches(entry, requestedTerm) {
  return normalizeEntry(entry) === normalizeEntry(requestedTerm);
}

function normalizeEntry(value) {
  return cleanText(value)
    .toLowerCase()
    .split(",")[0]
    .replace(/[()[\].;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value) {
  return decodeHtml(
    value
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<span[^>]*title="([^"]+)"[^>]*>[\s\S]*?<\/span>/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:])/g, "$1")
      .trim(),
  )
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function decodeHtml(value) {
  return value
    .replace(/&#40;/g, "(")
    .replace(/&#41;/g, ")")
    .replace(/&#91;/g, "[")
    .replace(/&#93;/g, "]")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&bull;/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function unique(values) {
  return [...new Set(values)];
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}
