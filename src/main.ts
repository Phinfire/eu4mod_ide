import { Game } from "./model/Game";
import { Language } from "./model/Language";
import { Nation } from "./model/Nation";
import { NationIdeasPanel } from "./ui/NationIdeasPanel";
import { NationTable as NationTablePanel } from "./ui/NationTable";

const dataUrl = "http://codingafterdark.de/ide/game.json"+ "?" + new Date().getUTCFullYear();

async function setup() {
    const gamePromise = fetch(dataUrl).then(response => {
        return response.json();
    }).then(json => {
        const game = new Game()
        game.loadNationalIdeas(json);
        return game;
    }).catch((error) => { console.error("Failed to load game data", error); return new Game() });

    const wrapper = document.getElementsByClassName('app-wrapper')[0];
    const main = document.createElement('div');
    main.classList.add('main');
    wrapper.appendChild(main);

    const ideasPanel = new NationIdeasPanel();
    const table = new NationTablePanel(5, (nation: Nation) => ideasPanel.show(nation.getIdeas(),nation.getAdjectiveinLanguage(Language.ENGLISH), nation.getFlagUrl()));
    main.appendChild(table.getPanel());
    main.appendChild(ideasPanel.getPanel()); 

    const game = await gamePromise;
    table.setNations(game.getAllNations().toSorted((a, b) => a.getNameinLanguage(Language.ENGLISH).localeCompare(b.getNameinLanguage(Language.ENGLISH))));
}

document.addEventListener('DOMContentLoaded', () => {
    setup();
});