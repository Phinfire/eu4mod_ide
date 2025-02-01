import { Game } from "./model/Game";
import { Language } from "./model/localisation/Language";
import { LocalisationProvider } from "./model/localisation/LocalisationProvider";
import { AlliancePoints } from "./managment/ui/AlliancePoints";
import { NationGuesser } from "./managment/NationGuesser";
import { AppWrapper } from "./ui/AppWrapper";
import { ITabApp } from "./ui/ITabApp";
import { Constants } from "./Constants";
import { LobbyManager } from "./managment/ui/LobbyManager";
import { Discord } from "./managment/points/Discord";
import { Login } from "./managment/ILogin";
import { AbstractLocalisationUser } from "./model/localisation/AbstractLocalisationUser";
import { parseLocalisationFile } from "./parse/parse";
import { UIFactory } from "./UIFactory";
import { SkanderbegVis } from "./managment/ui/SkanderbegVis";
import { BuildingValueHelper } from "./ui/BuildingValueHelper";
import { IdeasEditor } from "./managment/ui/IdeasEditor";
import { COAEditor } from "./ck3/coa/COAEditor";

const fetchPromises = ["common", "history"].map(key => fetch(Constants.WEBSERVER_URL + "game_" + key +".json").then(response => response.json()));

const gamePromise = Promise.all(fetchPromises
        .concat([fetch(Constants.WEBSERVER_URL + "map/definition.csv").then(response => response.text())])
        .concat([fetch(Constants.WEBSERVER_URL + "map/terrain.txt").then(response => response.text())])
        .concat([fetch(Constants.WEBSERVER_URL + "map/climate.txt").then(response => response.text())]))
    .then(results => {
        const game = new Game();
        game.loadAll(results[0], results[1], results[2], results[3], results[4]);
        return game;
    })
    .catch(error => {
        console.error("Failed to fetch data", error);
        return new Game();
    });
/*
const localisationPromise = fetch(Constants.WEBSERVER_URL + "game_localisation.json" + "?" + new Date().getUTCFullYear())
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
        return bigLocalisationMap;
    })
    .catch(error => {
        console.error("Failed to fetch localisation", error);
        return new Map<Language, Map<string, string>>();
    });

*/

const localisationPromise = fetch(Constants.WEBSERVER_URL + "tag2name.json").then(response => response.json()).then(tag2namejson => {
    const map = new Map<string, string>();
    for (let key of Object.keys(tag2namejson)) {
        map.set(key, tag2namejson[key]);
    }
    const loc = new Map<Language, Map<string, string>>();
    loc.set(Language.ENGLISH, map);
    return loc;
});

const discordPromise = Promise.resolve(new Discord()).then(discord => {
    const imported = discord.importUsers();
    return {discord: discord, imported: imported};
}).then(({discord, imported}) => {
    return discord;
});

async function setup() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('app-wrapper');
    document.body.appendChild(wrapper);

    const game = await gamePromise;
    const localisationProvider = new LocalisationProvider();
    await localisationProvider.setLocalisations(localisationPromise);
    const guesser = new NationGuesser(localisationProvider);
    const appNames2App = new Map<string, () => ITabApp>();
    const discord = await discordPromise;
    
    appNames2App.set("COA", () => new COAEditor());
    appNames2App.set("Ideas", () => new IdeasEditor(game, localisationProvider));
    appNames2App.set("Building?", () => new BuildingValueHelper(game));
    appNames2App.set("Skanderbeg", () => new SkanderbegVis(localisationProvider));
    appNames2App.set("Lobby Managment", () => new LobbyManager(Constants.WEB_SOCKET_URL, game, discord, localisationProvider));
    const wrapperObj = new AppWrapper(wrapper, appNames2App);
}

document.addEventListener('DOMContentLoaded', () => {
    setup();
});

const NAME_KEY = "eu4-lobby-managment-user-name";
const PASSWORD_KEY = "eu4-lobby-managment-user-password";

function hasLoginStored(): boolean {
    return localStorage.getItem(NAME_KEY) != null;
}

function storeLogin(login: Login) {
    localStorage.setItem(NAME_KEY, login.name);
    localStorage.setItem(PASSWORD_KEY, login.password!);
}

function getLogin(): Login {
    let name = localStorage.getItem(NAME_KEY);
    let password = localStorage.getItem(PASSWORD_KEY);
    return new Login(name!, password!);
}

function generatePassword(): string {
    return Math.random().toString(36).substring(7);
}