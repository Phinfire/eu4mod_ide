import { Game } from "./model/Game";
import { Language } from "./model/localisation/Language";
import { LocalisationProvider } from "./model/localisation/LocalisationProvider";   
import { parseLocalisationFile } from "./parse/parse";
import { AlliancePoints } from "./managment/ui/AlliancePoints";
import { NationGuesser } from "./managment/NationGuesser";
import { Constants } from "./Constants";

const fetchPromises = ["common", "history"].map(key => fetch("http://codingafterdark.de/ide/game_" + key +".json"+ "?" + new Date().getUTCFullYear()).then(response => response.json()));

const gamePromise = Promise.all(fetchPromises)
    .then(results => {
        const game = new Game();
        game.loadAll(results[0], results[1]);
        return game;
    })
    .catch(error => {
        console.error("Failed to fetch data", error);
        return new Game();
    });

const t0 = performance.now();
const localisationPromise = fetch("http://codingafterdark.de/ide/game_localisation.json" + "?" + new Date().getUTCFullYear())
    .then(response => response.json())
    .then(localisation => {
        const bigLocalisationMap = new Map<Language, Map<string, string>>();
        for (let language of Constants.getSupportedLangages()) {
            const locLookup = new Map<string, string>();
            for (let key of Object.keys(localisation).filter(key => key.includes("l_" + language))) {
                const fileLocLookup = parseLocalisationFile(localisation[key]);
                for (let key of fileLocLookup.keys()) {
                    //TODO: check if key duplicate
                    locLookup.set(key, fileLocLookup.get(key)!);
                }
            }
            bigLocalisationMap.set(language, locLookup);
        }
        const t1 = performance.now();
        console.log("Loading localisation: " + (t1 - t0) + " ms");
        return bigLocalisationMap;
    })
    .catch(error => {
        console.error("Failed to fetch localisation", error);
        return new Map<Language, Map<string, string>>();
    });

async function setup() {
    const wrapper = document.getElementsByClassName('app-wrapper')[0];
        /*
    const main = document.createElement('div');
    main.classList.add('main');
    wrapper.appendChild(main);
    const ideasPanel = new NationIdeasPanel();
    const table = new NationTablePanel("Nations", 6, (nation: Nation) => ideasPanel.show(nation.getIdeas(),nation, nation.getImageUrl()));
    main.appendChild(table.getPanel());
    main.appendChild(ideasPanel.getPanel()); 
    */

    const game = await gamePromise;
    const localisationProvider = new LocalisationProvider();
    //table.setNations(game.getAllNations());
    localisationProvider.setLocalisations(localisationPromise);
    //ideasPanel.setLocalisationProvider(localisationProvider);
    //table.setLocalisationProvider(localisationProvider);
    //table.refreshFilterState();
    const guesser = new NationGuesser(localisationProvider);
    new AlliancePoints("ws://localhost:8081/ws", localisationProvider, guesser, game)
}
document.addEventListener('DOMContentLoaded', () => {
    setup();
});