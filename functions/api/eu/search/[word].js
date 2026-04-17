const WIKTIONARY_API_URL = "https://eu.wiktionary.org/w/api.php";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SKIPPED_SECTIONS = [
  "ahoskera",
  "esaerak",
  "etimologia",
  "hitz eratorriak",
  "itzulpen",
  "jatorria",
  "sinonimoak",
];

export async function onRequestOptions() {
  return new Response(null, { headers: JSON_HEADERS });
}

export async function onRequestGet({ params }) {
  const word = params.word;

  if (!word) {
    return json({ error: "Missing word" }, 400);
  }

  try {
    const response = await fetch(buildWiktionaryUrl(word), {
      headers: {
        Accept: "application/json",
        "User-Agent": "JuegoDePalabras/1.0 (https://juego-de-palabras.pages.dev)",
      },
    });

    if (!response.ok) {
      throw new Error(`Wiktionary responded with ${response.status}`);
    }

    const data = await response.json();
    const page = data.query?.pages?.[0];
    const content = page?.revisions?.[0]?.slots?.main?.content || "";

    if (!content || page.missing) {
      return json({ definitions: [] });
    }

    return json({ definitions: extractDefinitions(content) });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

function buildWiktionaryUrl(word) {
  const url = new URL(WIKTIONARY_API_URL);
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "revisions");
  url.searchParams.set("rvprop", "content");
  url.searchParams.set("rvslots", "main");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("titles", word);
  return url.toString();
}

function extractDefinitions(content) {
  const definitions = [];
  let skippedSection = false;

  for (const line of content.split("\n")) {
    const heading = line.match(/^={2,}\s*(.*?)\s*=+\s*$/);
    if (heading) {
      const section = cleanWikitext(heading[1]).toLowerCase();
      skippedSection = SKIPPED_SECTIONS.some((name) => section.includes(name));
      continue;
    }

    if (skippedSection) {
      continue;
    }

    const definition = line.match(/^#+(?![*#:;])\s*(.+)$/);
    if (!definition) {
      continue;
    }

    const cleaned = cleanWikitext(definition[1]);
    if (cleaned) {
      definitions.push(cleaned);
    }

    if (definitions.length >= 12) {
      return definitions;
    }
  }

  return definitions;
}

function cleanWikitext(value) {
  return decodeHtml(
    value
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\[\[File:[^\]]+\]\]/gi, "")
      .replace(/\[\[Irudi:[^\]]+\]\]/gi, "")
      .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, "$1")
      .replace(/\[\[([^\]]+)\]\]/g, "$1")
      .replace(/\{\{(?:Lema|IPA|Audio|audio|wikipedia)[^}]*\}\}/gi, "")
      .replace(/\{\{([^|{}]+)\}\}/g, "$1")
      .replace(/\{\{[^}]*\|([^|{}]+)\}\}/g, "$1")
      .replace(/'{2,}/g, "")
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
