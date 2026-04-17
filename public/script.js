document.addEventListener('DOMContentLoaded', async () => {
    // Elementos de la interfaz
    const startBtn = document.getElementById('startBtn');
    const muteBtn = document.getElementById('muteBtn');
    const responseOutput = document.getElementById('definitions');
    const loadingMessage = document.getElementById('loading');
    const wordInput = document.getElementById('wordInput');
    const getDefinitionBtn = document.getElementById('getDefinitionBtn');
    const currentWordElement = document.getElementById('current-word');
    const messageElement = document.getElementById('message');
    const restartBtn = document.getElementById('restartBtn');
    const searchContainer = document.getElementById('search-container');
    const titleDiv = document.getElementById('title');
    const nameDiv = document.getElementById('name');
    const giveUpBtn = document.getElementById('giveUpBtn');
    const clicks = document.getElementById('clicks');
    const easyBtn = document.getElementById('easyBtn');
    const languageBtn = document.getElementById('languageBtn');
    const nav = document.getElementById('nav');
    const titleWordOne = document.getElementById('titleWordOne');
    const titleWordTwo = document.getElementById('titleWordTwo');
    const titleConnector = document.getElementById('titleConnector');
    const byLabel = document.getElementById('byLabel');
    const jamLabel = document.getElementById('jamLabel');
    const dictionaryCredit = document.getElementById('dictionaryCredit');
    const dictionarySource = document.getElementById('dictionarySource');
    const themeLabel = document.getElementById('themeLabel');
    const themeText = document.getElementById('themeText');

    const MAX_LINES = 5;

    const codes = `
    CNLE2-907ZL-8YAV9
    3NHI6-477GR-GMCRG
    27TLM-6CP4X-APIAL
    Y9YEN-GCE2G-ADNGX
    LEVMA-YHW0B-874A9
    L80J2-YCVIJ-697HG
    W3Q44-LVKAJ-JGI2K
    DFHE7-RENW3-KB6RR
    W0MXW-7AVIP-5DI4C
    A4Q95-DVT3Z-TVTQC
    IXG5F-XZ6G0-LQYEN
    CKNHI-V9ENA-TWBTI
    FHN8L-GEQZK-TX4J7
    CWQIW-2YZXF-IJ006
    0Q6XX-0C89V-KM5ZJ
    GM42A-N9P0H-4GLIM
    7NDRD-5MM6P-W24QA
    BCKXH-BMI2Y-IZAQ6
    WF3Q2-32YAM-0WV5I
    NFXQG-CF0JI-JL3GG
    QY4JK-LQV23-VWVZ6
    7M3BN-Z6KW0-EFT7H
    CBEAV-YMZVR-JM3CP
    HFIBY-ZH3VG-PAGEA
    `;

    let isMuted = false;
    let clickCount = 0;
    let sinceGivenUp = 99999;

    let dictionaryWords = [];
    let currentWordIndex = 0;

    // Lista de palabras que no deben convertirse en enlaces
    const excludeWords = ['singular', 'ante', 'prnl', 'der', 'méx', 'hond', 'ant', 'ant', 'fís', 'esc', 'desus', 'sin', 'ec', 'coloq', 'etc', 'debida', 'antambién', 'hipervínculo'];  // Reemplaza con las palabras que deseas excluir
    const customDefinitions = {
        roquekes: {
            definitions: {
                es: [
                    'Autor, artista o criatura jugable pendiente de definición definitiva. Sin.: placeholder, coautor, nombre propio.',
                    'Persona que aparece en los créditos y merece una acepción mejor escrita. Sin.: pendiente, firma, cómplice.'
                ],
                en: [
                    'Author, artist, or playable creature awaiting a definitive definition. Syn.: placeholder, coauthor, proper noun.',
                    'Person appearing in the credits who deserves a better-written entry. Syn.: pending, signature, accomplice.'
                ]
            },
            actions: [
                { label: 'Instagram', url: 'https://www.instagram.com/roquekes?igsh=Z3UwODg0YjZvNGhr' }
            ]
        },
        clovelt: {
            definitions: {
                es: [
                    'Autor, código o entidad colaboradora pendiente de definición definitiva. Sin.: placeholder, coautor, nombre propio.',
                    'Persona que aparece en los créditos y necesita una acepción menos improvisada. Sin.: pendiente, firma, cómplice.'
                ],
                en: [
                    'Author, code, or collaborating entity awaiting a definitive definition. Syn.: placeholder, coauthor, proper noun.',
                    'Person appearing in the credits who needs a less improvised entry. Syn.: pending, signature, accomplice.'
                ]
            },
            actions: [
                { label: 'X / Twitter', url: 'https://x.com/clovelt' }
            ]
        }
    };

    // Mostrar barra de búsqueda si hay ?cheat en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const apiBaseUrl = (urlParams.get('api') || '').replace(/\/$/, '');
    const browserLanguage = navigator.language || navigator.userLanguage || '';
    let language = urlParams.get('lang') || (browserLanguage.toLowerCase().startsWith('es') ? 'es' : 'en');
    language = language.toLowerCase().startsWith('es') ? 'es' : 'en';
    
    const isCheat = urlParams.has('cheat');

    if (isCheat) {
        const cheatSuffix = document.createElement('span');
        cheatSuffix.id = 'cheatSuffix';
        nameDiv.appendChild(cheatSuffix);
    }

    // Función para reproducir sonidos
    const playSound = (sound) => {
        if (!isMuted) {
            zzfx(...sound);
        }
    };

    let makeLinks;

    const getStartWord = () => language === 'es' ? 'mal' : 'bad';

    const copy = {
        es: {
            pageTitle: 'De mal en peor',
            cheatSuffix: ' (pero eres un tramposo)',
            titleWordOne: 'Juego',
            titleConnector: 'de',
            titleWordTwo: 'Palabras',
            byLabel: 'Por',
            jamLabel: 'Para la',
            dictionaryCredit: 'Definiciones cortesía de la',
            dictionarySource: 'RAE',
            dictionarySourceUrl: 'https://x.com/RAEinforma',
            themeLabel: 'Tema:',
            themeText: 'de mal en peor',
            start: 'Jugar',
            searchPlaceholder: 'Escribe una palabra',
            search: 'Buscar definición',
            loading: 'Cargando definiciones...',
            noDefinitions: 'No hay definiciones.',
            error: 'Algo ha fallado',
            emptySearch: 'Escribe una palabra',
            counter: 'Def.',
            searched: 'Definiciones buscadas:',
            giveUp: 'Rendirse',
            easy: 'Modo fácil (no hay vuelta atrás)',
            restart: 'Volver a "mal"',
            giveUpWord: 'Dignidad',
            easyWord: 'Meritocracia',
        },
        en: {
            pageTitle: 'From bad to worse',
            cheatSuffix: ' (but you are a cheater)',
            titleWordOne: 'Game',
            titleConnector: 'of',
            titleWordTwo: 'Words',
            byLabel: 'By',
            jamLabel: 'For',
            dictionaryCredit: 'Definitions courtesy of',
            dictionarySource: 'Wiktionary',
            dictionarySourceUrl: 'https://en.wiktionary.org/',
            themeLabel: 'Theme:',
            themeText: 'from bad to worse',
            start: 'Play',
            searchPlaceholder: 'Type a word',
            search: 'Search definition',
            loading: 'Loading definitions...',
            noDefinitions: 'No definitions found.',
            error: 'Something went wrong',
            emptySearch: 'Type a word',
            counter: 'Def.',
            searched: 'Definitions searched:',
            giveUp: 'Give up',
            easy: 'Easy mode (no going back)',
            restart: 'Back to "bad"',
            giveUpWord: 'dignity',
            easyWord: 'meritocracy',
        }
    };

    const applyLanguage = () => {
        const text = copy[language];
        const cheatSuffix = document.getElementById('cheatSuffix');
        document.documentElement.lang = language;
        document.title = text.pageTitle + (isCheat ? text.cheatSuffix : '');
        titleWordOne.textContent = text.titleWordOne;
        titleConnector.textContent = text.titleConnector;
        titleWordTwo.textContent = text.titleWordTwo;
        byLabel.textContent = text.byLabel;
        jamLabel.textContent = text.jamLabel;
        dictionaryCredit.textContent = text.dictionaryCredit;
        dictionarySource.textContent = text.dictionarySource;
        dictionarySource.href = text.dictionarySourceUrl;
        themeLabel.textContent = text.themeLabel;
        themeText.textContent = text.themeText;
        startBtn.textContent = text.start;
        wordInput.placeholder = text.searchPlaceholder;
        getDefinitionBtn.textContent = text.search;
        loadingMessage.textContent = text.loading;
        giveUpBtn.textContent = text.giveUp;
        easyBtn.textContent = text.easy;
        restartBtn.textContent = text.restart;
        if (cheatSuffix) {
            cheatSuffix.textContent = text.cheatSuffix;
        }
    };

    const updateLanguageButton = () => {
        languageBtn.textContent = language === 'es' ? 'English' : 'Español';
    };

    const updateMuteButton = () => {
        muteBtn.textContent = isMuted
            ? (language === 'es' ? 'Ruido' : 'Noise')
            : (language === 'es' ? 'Silencio' : 'Silence');
    };

    const t = (key) => copy[language][key];

    applyLanguage();
    updateLanguageButton();
    updateMuteButton();

    // Función para obtener definiciones y actualizar la interfaz
    const fetchDefinitions = async (word) => {
        currentWordElement.textContent = word;
        responseOutput.innerHTML = '';
        loadingMessage.style.display = 'block';
        messageElement.textContent = '';

        try {
            const localEntry = customDefinitions[word.toLowerCase()];
            const data = localEntry
                ? { definitions: localEntry.definitions[language], actions: localEntry.actions }
                : await fetchDictionaryDefinitions(word);
            loadingMessage.style.display = 'none';

            if (data.definitions.length === 0) {
                responseOutput.textContent = t('noDefinitions');
                return;
            }

            // Mostrar definiciones con efecto de máquina de escribir y sonido
            responseOutput.innerHTML = '';
            let index = 0;
            const typeWriter = () => {
                if (index < Math.min(data.definitions.length, MAX_LINES)) {
                    const definitionElement = document.createElement('div');
                    const text = `<strong style="font-family: monospace;">${index + 1}. </strong> ${makeLinks ? linkify(data.definitions[index]) : data.definitions[index]}`;
                    definitionElement.innerHTML = text.replace(/(Sin\.|Ant\.)/g, '<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="font-family: Baskervville;">$1<span>');
                    responseOutput.appendChild(definitionElement);
                    playSound([1.09,,261,.01,.01,.09,1,1.41,,,,,,.1,,.05,.97,.02]); // zzfx sound for loading line
                    index++;
                    setTimeout(typeWriter, isCheat? 10 : 500); // Tiempo
                } else {
                    addClickEventToLinks();
                    if (data.actions) {
                        addDefinitionActions(data.actions);
                    }
                    giveUpBtn.disabled = false;
                }
            };
            typeWriter();

        } catch (error) {
            loadingMessage.style.display = 'none';
            responseOutput.textContent = `${t('error')}: ${error.message}`;
        }
    };

    const fetchDictionaryDefinitions = async (word) => {
        const endpoint = language === 'es' ? 'rae' : 'en';
        const response = await fetch(`${apiBaseUrl}/api/${endpoint}/search/${encodeURIComponent(word)}`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    };

    const addDefinitionActions = (actions) => {
        const actionsElement = document.createElement('div');
        actionsElement.className = 'definition-actions';

        actions.forEach(action => {
            const link = document.createElement('a');
            link.href = action.url;
            link.textContent = action.label;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            actionsElement.appendChild(link);
        });

        responseOutput.appendChild(actionsElement);
    };

    // Función para convertir palabras en enlaces clicables, excluyendo ciertas palabras y palabras de una sola letra
    const linkify = (text) => {
        return text.replace(/([\p{L}\p{M}\p{N}]+)/gu, (match) => {
            return excludeWords.includes(match.toLowerCase()) || (!isCheat && match.length < 4) ? match : `<a href="#" class="ag-tab">${match}</a>`;
        });
    };

    // Función para agregar eventos de clic a los enlaces
    const addClickEventToLinks = () => {
        const links = responseOutput.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const clickedWord = link.textContent.toLowerCase();
                giveUpBtn.disabled = true;
                clickCount++;
                clicks.innerHTML = t('counter') + ' ' + (clickCount+1);
                if (clickCount > 7 && sinceGivenUp === 99999) {
                    giveUpBtn.style.display = 'inline';
                }
                if (clickCount > sinceGivenUp+6) {
                    easyBtn.style.display = 'inline';
                    sinceGivenUp = 99999999;
                }
                playSound([1.09,,523.25,.01,.01,.09,1,1.41,,,,,,.1,,.05,.97,.02]); // zzfx sound for clicking link
                handleWordClick(clickedWord);
            });
        });
    };

    const ending = (message, sound, wordToFetch) => {
        makeLinks = false;
        fetchDefinitions(wordToFetch);
        messageElement.innerHTML = '<p style="font-size:1.3em;">' + message + ' <br> <strong>' + t('searched') + ' ' + clickCount + '</strong> </p>';
        restartBtn.style.display = 'inline';
        playSound(sound);
    };

    const endings = {
        es: {
            peor: { message: '<br>¿Has llegado al final? A lo mejor sí, a lo mejor no.', sound: [,,662,.82,.11,.33,1,0,,-0.2,,,,1.2,,.26,.01] },
            mejor: { message: '<br>De mejor a peor, y de arriba a...', sound: [,,80,.3,.4,.7,2,.1,-0.73,3.42,-430,.09,.17,,,,.19] },
            abajo: { message: '<br>...al centro y...', sound: [,.5,847,.02,.3,.9,1,1.67,,,-294,.04,.13,,,,.1] },
            adentro: { word: 'despiste', message: '<br>(esto es una distracción)', sound: [,,172,.8,,.8,1,.76,7.7,3.73,-482,.08,.15,,.14] },
            despiste: { message: '<br>Si aquí te sales del asfalto, es que te gusta estar con Ducir.', sound: [,0,960,,1,.01,,.8,-0.01,,-190,.5,,.05,,,1] },
            conducir: { message: '<br>Ahora pareces enterarte, pero todavía no estás encima del bordillo.', sound: [1.5,0,250,.02,.02,.2,2,2,,,,,.02,,,.02,.01,,,.1] },
            sobresaliente: { message: '<br>Queda poco. Esta es la primera de todas.', sound: [,,20,.04,,.6,,1.31,,,-990,.06,.17,,,.04,.07] },
            malo: { message: '<br>Estás casi. El hombre que lo vendió no lo quería. El hombre que lo compró no lo necesitaba. El hombre que lo usó no lo conocía.', sound: [,.2,40,.5,,1.5,,11,,,,,,199] },
            'ataúd': { message: '<br>Has llegado. El final estaba, desde el principio, en tu corazón.', sound: [,.3,1975,.08,.56,.02,,,-0.4,,-322,.56,.41,,,,.25] },
            'corazón': { word: 'Ganador', message: '<br>Gracias por tener una obsesión ridícula o ser tan tramposo como para mirar el código. Regalo aquí unas claves, coge una y deja para el resto: <br>' + codes, sound: [,,471,,.09,.47,4,1.06,-6.7,,,,,.9,61,.1,,.82,.09,.13] },
        },
        en: {
            worse: { message: '<br>Have you reached the end? Maybe yes, maybe no.', sound: [,,662,.82,.11,.33,1,0,,-0.2,,,,1.2,,.26,.01] },
            better: { message: '<br>From better to worse, and from up to...', sound: [,,80,.3,.4,.7,2,.1,-0.73,3.42,-430,.09,.17,,,,.19] },
            down: { message: '<br>...the center and...', sound: [,.5,847,.02,.3,.9,1,1.67,,,-294,.04,.13,,,,.1] },
            inside: { word: 'distraction', message: '<br>(this is a distraction)', sound: [,,172,.8,,.8,1,.76,7.7,3.73,-482,.08,.15,,.14] },
            distraction: { message: '<br>If you leave the road here, you clearly enjoy being misled.', sound: [,0,960,,1,.01,,.8,-0.01,,-190,.5,,.05,,,1] },
            drive: { message: '<br>Now you seem to get it, but you are still not on the curb.', sound: [1.5,0,250,.02,.02,.2,2,2,,,,,.02,,,.02,.01,,,.1] },
            outstanding: { message: '<br>Not much left. This is the first of all.', sound: [,,20,.04,,.6,,1.31,,,-990,.06,.17,,,.04,.07] },
            bad: { message: '<br>You are close. The person who sold it did not want it. The person who bought it did not need it. The person who used it did not know it.', sound: [,.2,40,.5,,1.5,,11,,,,,,199] },
            coffin: { message: '<br>You made it. The ending was, from the beginning, in your heart.', sound: [,.3,1975,.08,.56,.02,,,-0.4,,-322,.56,.41,,,,.25] },
            heart: { word: 'Winner', message: '<br>Thanks for having a ridiculous obsession, or for cheating hard enough to read the code. Here are some keys; take one and leave the rest: <br>' + codes, sound: [,,471,,.09,.47,4,1.06,-6.7,,,,,.9,61,.1,,.82,.09,.13] },
        }
    };
    
    const handleWordClick = (clickedWord) => {
        const languageEndings = endings[language];
        const endingMatch = languageEndings[clickedWord];

        if (endingMatch) {
            ending(endingMatch.message, endingMatch.sound, endingMatch.word || clickedWord);
            return;
        }

        fetchDefinitions(clickedWord);
    };

    const startGame = (startWord) => {
        playSound([,,224,.02,.02,.08,1,1.7,-13.9,,,,,,6.7]);
        startBtn.style.display = 'none';
        titleDiv.style.display = 'none';
        languageBtn.style.display = 'none';
        muteBtn.style.display = 'inline';
        currentWordElement.style.display = 'block';
        nav.style.display = 'block';
        makeLinks = true;
        if (isCheat) {
            searchContainer.style.display = 'inline';
        }
        fetchDefinitions(startWord);
    };
    
    // Evento del botón de inicio
    startBtn.addEventListener('click', (event) => {
        startGame(getStartWord());
    });

    document.querySelectorAll('.startGame').forEach(startGameLinks => {
        startGameLinks.addEventListener('click', (event) => {
            event.preventDefault();
            const clickedWord = language === 'es'
                ? event.currentTarget.dataset.word || event.currentTarget.textContent.trim()
                : event.currentTarget.dataset.wordEn || event.currentTarget.dataset.word || event.currentTarget.textContent.trim();
            startGame(clickedWord);
        });
    });

    languageBtn.addEventListener('click', () => {
        language = language === 'es' ? 'en' : 'es';
        applyLanguage();
        updateLanguageButton();
        updateMuteButton();
        responseOutput.innerHTML = '';
        messageElement.textContent = '';
        currentWordElement.style.display = 'none';
    });


    muteBtn.addEventListener('click', () => {
        if (!isMuted) {
            playSound([1.09,.5,270,,.1,,1,1.5,,,,,,,,.1,.01]);
        }
        isMuted = !isMuted;
        updateMuteButton();
        if (window.getComputedStyle(startBtn).display !== 'none') {
            currentWordElement.style.display = 'block';
        }
        fetchDefinitions(isMuted ? (language === 'es' ? 'Silencio' : 'Silence') : (language === 'es' ? 'Ruido' : 'Noise'));
    });

    giveUpBtn.addEventListener('click', () => {
        fetchDefinitions(t('giveUpWord'));
        giveUpBtn.style.display = 'none';
        if (sinceGivenUp === 99999) sinceGivenUp = clickCount;
        playSound([1.9,,151,.03,.09,,1,.7,2,-14,,,,.5,,,.22,.85,.12]);
    });

    easyBtn.addEventListener('click', () => {
        fetchDefinitions(t('easyWord'));
        easyBtn.style.display = 'none';
        searchContainer.style.display = 'inline';
        playSound([,,364,.08,.25,.16,,0,,,-170,.07,.03,,,.1,,.59,.25]);
    });

    // Obtener definiciones al hacer clic en el botón
    getDefinitionBtn.addEventListener('click', async () => {
        const word = wordInput.value;
        if (!word) {
            responseOutput.textContent = t('emptySearch');
            return;
        }
        playSound([1.09,.8,999,,,,,1.5,,.3,-99,.1,1.63,,,.11,.22]); // zzfx sound for button press
        fetchDefinitions(word);
    });

    // Reiniciar el juego al hacer clic en el botón "Volver a 'mal'"
    restartBtn.addEventListener('click', () => {
        clickCount = 0;
        makeLinks = true;
        fetchDefinitions(getStartWord());
        restartBtn.style.display = 'none';
        messageElement.textContent = '';
        clicks.innerHTML = '';
        playSound([1.09,0,960,,1,.01,,.8,-0.01,,-190,.5,,.05,,,1]); // zzfx sound for restart
    });

    const tabClass = '.ag-tab';
    const selectedTabClass = 'ag-tab-selected';

    document.querySelectorAll(tabClass).forEach(tab => {
      tab.addEventListener('click', e => {
        if (tab.classList.contains(selectedTabClass)) {
          return;
        }
        const selectedTab = document.querySelector(`.${selectedTabClass}`);
        if (selectedTab) {
          selectedTab.classList.remove(selectedTabClass);
        }
        tab.classList.add(selectedTabClass);
      });
    });

    document.addEventListener('keydown', e => {
      let tabTriggers = Array.from(document.querySelectorAll(tabClass)).filter(tab => {
        return window.getComputedStyle(tab).display !== 'none';
      });
      let selectedIndex = -1;
      // Find the currently selected tab index
      for (let i = 0; i < tabTriggers.length; i++) {
        if (tabTriggers[i].classList.contains(selectedTabClass)) {
          selectedIndex = i;
          break;
        }
      }

      if (e.key === 'ArrowRight') {
        if (selectedIndex === -1) {
          tabTriggers[0].classList.add(selectedTabClass);
        } else if (selectedIndex < tabTriggers.length - 1) {
          tabTriggers[selectedIndex].classList.remove(selectedTabClass);
          tabTriggers[selectedIndex + 1].classList.add(selectedTabClass);
        } else {
        }
      }

      if (e.key === 'ArrowLeft') {
        if (selectedIndex === -1) {
          tabTriggers[0].classList.add(selectedTabClass);
        } else if (selectedIndex > 0) {
          tabTriggers[selectedIndex].classList.remove(selectedTabClass);
          tabTriggers[selectedIndex - 1].classList.add(selectedTabClass);
        } else {
        }
      }

      if (e.key === 'Enter') {
        if (window.getComputedStyle(startBtn).display !== 'none') startGame(getStartWord());
        if (selectedIndex !== -1) {
          tabTriggers[selectedIndex].click();
        }
      }
    });

});
