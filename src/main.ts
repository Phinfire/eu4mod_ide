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

const tag2NamePromise = fetch(Constants.WEBSERVER_URL + "tag2name.json")
    .then(response => response.json())
    .then(tag2namejson => {
        const map = new Map<string, string>();
        for (let key of Object.keys(tag2namejson)) {
            map.set(key, tag2namejson[key]);
        }
        return map;
    })
    .catch(error => {
        console.error("Failed to fetch tag2name", error);
        throw error;
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
        const t1 = performance.now();
        console.log("Loading localisation: " + (t1 - t0) + " ms");
        return bigLocalisationMap;
    })
    .catch(error => {
        console.error("Failed to fetch localisation", error);
        return new Map<Language, Map<string, string>>();
    });
*/
const localisationPromise = Promise.resolve(new Map<Language, Map<string, string>>()); 

async function setup() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('app-wrapper');
    document.body.appendChild(wrapper);

    const game = await gamePromise;
    const localisationProvider = new LocalisationProvider();
    await localisationProvider.setLocalisations(localisationPromise);
    const guesser = new NationGuesser(localisationProvider);
    const mep = new Map<string, () => ITabApp>();
    const discord = new Discord();
    //clear local storage
    //localStorage.clear();
    const go = (login: Login) => {
        console.log("Logging in as " + login.name + ", " + login.password);
        storeLogin(login);
        discord.importUsers().then((users) => {
            mep.set("Test", () => new LobbyManager(Constants.WEB_SOCKET_URL, login, game, discord, localisationProvider));
            const wrapperObj = new AppWrapper(wrapper, mep);
        });
    };
    if (hasLoginStored()) {
        go(getLogin());
    } else {
        const popup = AppWrapper.getPopupContainer(false);
        popup.popup.appendChild(UIFactory.fabricateInputButtonCombo(["You are?"], "Login", [false], [""], (values) => {
            go(new Login(values[0], generatePassword()));
            popup.exitFunction();
        }));
    }
    //mep.set("Alliance Points", () => new AlliancePoints(Constants.WEB_SOCKET_URL, localisationProvider, guesser, game));
    //"ws://localhost:8081/ws"
    //mep.set("Map", () => new MapSelect(game));
    //mep.set("Alliance Points", (div: HTMLDivElement) => new AlliancePoints("ws://localhost:8081/ws", localisationProvider, guesser, game, div));
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