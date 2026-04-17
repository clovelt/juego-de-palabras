const ELHUYAR_SEARCH_URL = "https://www.euskadi.eus/web01-apelhuya/eu/ab34aElhuyarHiztegiaWar/ab34ahiztegia/bilatu";

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
    const exactHtml = await requestElhuyar(word);
    let definitions = extractDefinitions(exactHtml);

    if (definitions.length === 0) {
      const wildcardHtml = await requestElhuyar(`${word}*`);
      definitions = extractDefinitions(wildcardHtml);
    }

    return json({ definitions });
  } catch (error) {
    return json({ error: error.message || String(error) }, 500);
  }
}

async function requestElhuyar(term) {
  const body = new URLSearchParams({
    hizk: "E",
    terminoaSort: term,
  });

  const response = await fetch(ELHUYAR_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "JuegoDePalabras/1.0 (https://juego-de-palabras.pages.dev)",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Elhuyar responded with ${response.status}`);
  }

  return response.text();
}

function extractDefinitions(html) {
  const entry = firstMatch(html, /<h2>\s*([\s\S]*?)\s*<\/h2>/i);
  const jumbotron = firstMatch(html, /<div class="jumbotron">([\s\S]*?)<div class="logo_elhuyar">/i) || "";

  if (!entry || !jumbotron) {
    return [];
  }

  const definitions = [];
  const senseBlocks = jumbotron.split("<!-- Adi-zki -->").slice(1);

  for (const block of senseBlocks) {
    const beforeExamples = block.split("<!-- Adibideak -->")[0] || block;
    const category = cleanText(firstMatch(beforeExamples, /<!-- kategoria-->\s*([\s\S]*?)<!-- eremugeogr-->/i));
    const translation = cleanText(lastTranslationChunk(beforeExamples));
    const examples = extractExamples(block);

    if (!translation) {
      continue;
    }

    const prefix = category ? `${category}: ` : "";
    const example = examples[0] ? ` | ${examples[0]}` : "";
    definitions.push(`${entry}. ${prefix}${translation}${example}`);

    if (definitions.length >= 8) {
      return definitions;
    }
  }

  if (definitions.length === 0) {
    definitions.push(...extractRelatedTerms(jumbotron, entry));
  }

  return unique(definitions).slice(0, 12);
}

function lastTranslationChunk(block) {
  const matches = [...block.matchAll(/((?:<a [^>]*\/ordaina\/[\s\S]*?<\/a>|[A-Za-zÀ-ÿñÑ,\- ]+)(?:\s*[,;]\s*(?:<a [^>]*\/ordaina\/[\s\S]*?<\/a>|[A-Za-zÀ-ÿñÑ,\- ]+))*)/g)]
    .map((match) => match[1])
    .filter((value) => /\/ordaina\//.test(value));

  return matches.at(-1) || "";
}

function extractExamples(block) {
  const examples = [];
  const matches = block.matchAll(/<em>([\s\S]*?)<\/em>\s*:\s*&nbsp;\s*([\s\S]*?)(?=<|\n)/g);

  for (const match of matches) {
    const basque = cleanText(match[1]);
    const spanish = cleanText(match[2]);

    if (basque && spanish) {
      examples.push(`${basque}: ${spanish}`);
    }
  }

  return examples;
}

function extractRelatedTerms(jumbotron, entry) {
  const terms = [...jumbotron.matchAll(/class="list-group-item active">([\s\S]*?)<\/a>/g)]
    .map((match) => cleanText(match[1]))
    .filter((term) => term && term.toLowerCase() !== entry.toLowerCase());

  return unique(terms).map((term) => `${entry}. Lotutako sarrera: ${term}`);
}

function firstMatch(value, pattern) {
  return value.match(pattern)?.[1] || "";
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
  );
}

function decodeHtml(value) {
  return value
    .replace(/&#40;/g, "(")
    .replace(/&#41;/g, ")")
    .replace(/&#91;/g, "[")
    .replace(/&#93;/g, "]")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
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
