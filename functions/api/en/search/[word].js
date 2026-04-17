const WIKTIONARY_DEFINITION_URL = "https://en.wiktionary.org/api/rest_v1/page/definition/";

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
    const response = await fetch(`${WIKTIONARY_DEFINITION_URL}${encodeURIComponent(word)}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "JuegoDePalabras/1.0 (https://juego-de-palabras.pages.dev)",
      },
    });

    if (response.status === 404) {
      return json({ definitions: [] });
    }

    if (!response.ok) {
      throw new Error(`Wiktionary responded with ${response.status}`);
    }

    const data = await response.json();
    return json({ definitions: extractEnglishDefinitions(data) });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

function extractEnglishDefinitions(data) {
  const entries = data.en || [];
  const definitions = [];

  for (const entry of entries) {
    for (const item of entry.definitions || []) {
      const definition = cleanDefinition(item.definition);

      if (definition) {
        definitions.push(definition);
      }

      if (definitions.length >= 12) {
        return definitions;
      }
    }
  }

  return definitions;
}

function cleanDefinition(definition) {
  return decodeHtml(
    definition
      .replace(/<ol[\s\S]*$/i, "")
      .replace(/<ul[\s\S]*$/i, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}
