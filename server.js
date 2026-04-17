const express = require('express');
const { RAE } = require('rae-api');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

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
        const definitions = result.getDefinitions().map(def => def.getDefinition());
        res.json({ definitions });
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
