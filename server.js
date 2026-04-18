const express = require('express');
const { RAE } = require('rae-api');
const path = require('path');
const https = require('https');
const app = express();
const port = process.env.PORT || 3000;
const EEH_SEARCH_URL = 'https://www.ehu.eus/eeh/cgi/bila';

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/rae/wotd', async (req, res) => {
    try {
        const rae = new RAE();
        const wotd = await rae.getWordOfTheDay();
        const word = wotd.getHeader();
        res.json({ word });
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

app.get('/api/rae/search/:word', async (req, res) => {
    const word = req.params.word;
    try {
        const rae = new RAE();
        const search = await rae.searchWord(word);
        const wordId = search.getRes()[0].getId();
        const result = await rae.fetchWord(wordId);
        const definitions = result.getDefinitions().map(def => normalizeRaeDefinition(def.getDefinition()));
        res.json({ definitions });
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

app.get('/api/eu/search/:word', async (req, res) => {
    const word = req.params.word;
    try {
        for (const term of buildBasqueSearchTerms(word)) {
            const html = await requestEeh(term);
            const definitions = extractEehDefinitions(html, term);

            if (definitions.length > 0) {
                res.json({ definitions });
                return;
            }
        }

        res.json({ definitions: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

function normalizeRaeDefinition(definition) {
    return definition
        .replace(/\bAntambién\s*:/g, 'Ant.:')
        .replace(/([.;])(?=(?:Sin|Ant)\.:)/g, '$1 ')
        .replace(/\b(Sin|Ant)\.:\s*/g, '$1.: ')
        .replace(/\.\s+\./g, '.')
        .replace(/\s+([,.;:])/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

function requestEeh(term) {
    const url = new URL(EEH_SEARCH_URL);
    url.searchParams.set('z', term);

    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                Accept: 'text/html',
                'User-Agent': 'JuegoDePalabras/1.0 (local)',
            },
        }, response => {
            const chunks = [];

            response.on('data', chunk => {
                chunks.push(chunk);
            });
            response.on('end', () => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    reject(new Error(`EEH responded with ${response.statusCode}`));
                    return;
                }

                resolve(Buffer.concat(chunks).toString('latin1'));
            });
        }).on('error', reject);
    });
}

function buildBasqueSearchTerms(word) {
    const normalized = word.toLowerCase();
    const terms = [normalized];
    const add = term => {
        if (term && term.length >= 3) {
            terms.push(term);
        }
    };

    if (normalized.endsWith('ak')) {
        add(normalized.slice(0, -1));
        add(normalized.slice(0, -2));
    }

    if (normalized.endsWith('ek')) {
        add(normalized.slice(0, -1));
        add(normalized.slice(0, -2));
    }

    if (normalized.endsWith('a')) {
        add(normalized.slice(0, -1));
    }

    if (normalized.endsWith('tzeko')) {
        const stem = normalized.slice(0, -5);
        add(`${stem}tu`);
        add(`${stem}du`);
        add(stem);
    }

    if (normalized.endsWith('teko')) {
        const stem = normalized.slice(0, -4);
        add(`${stem}tu`);
        add(stem);
    }

    for (const suffix of ['etan', 'etara', 'etatik', 'arekin', 'aren', 'ari', 'ean', 'en', 'ko', 'ra', 'tik', 'tan', 'an']) {
        if (normalized.endsWith(suffix)) {
            add(normalized.slice(0, -suffix.length));
        }
    }

    return [...new Set(terms)];
}

function extractEehDefinitions(html, requestedTerm) {
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

    return [...new Set(definitions)].slice(0, 12);
}

function removeEehSenseNumber(definition) {
    return definition
        .replace(/^\d+[a-z]?\s+/u, '')
        .replace(/^((?:\p{L}+(?:,\s*)?)+)\s+\d+[a-z]?\s+/u, '$1 ')
        .replace(/\s+/g, ' ')
        .trim();
}

function entryMatches(entry, requestedTerm) {
    return normalizeEntry(entry) === normalizeEntry(requestedTerm);
}

function normalizeEntry(value) {
    return cleanText(value)
        .toLowerCase()
        .split(',')[0]
        .replace(/[()[\].;:]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanText(value) {
    return decodeHtml(
        value
            .replace(/<!--[\s\S]*?-->/g, ' ')
            .replace(/<span[^>]*title="([^"]+)"[^>]*>[\s\S]*?<\/span>/g, '$1')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/\s+([,.;:])/g, '$1')
            .trim(),
    )
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.;:])/g, '$1')
        .trim();
}

function decodeHtml(value) {
    return value
        .replace(/&#40;/g, '(')
        .replace(/&#41;/g, ')')
        .replace(/&#91;/g, '[')
        .replace(/&#93;/g, ']')
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&bull;/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}
