import { Game } from "../../model/Game";
import { AbstractLocalisationUser } from "../../model/localisation/AbstractLocalisationUser";
import { LocalisationProvider } from "../../model/localisation/LocalisationProvider";
import { Skanderbeg } from "../../skanderbeg/Skanderbeg";
import { AppWrapper } from "../../ui/AppWrapper";
import { ITabApp } from "../../ui/ITabApp";
import { UIFactory } from "../../UIFactory";
import { Login } from "../ILogin";
import { Lobby } from "../lobbies/Lobby";
import { LobbyManagmentWebsocketHandler } from "../LobbyManagmentWebsocketHandler";
import { LobbyRespository } from "../LobbyRepository";
import { Discord } from "../points/Discord";
import { AlliancePoints } from "./AlliancePoints";

export class LobbyManager implements ITabApp {

    private static readonly NAME_KEY = "eu4-lobby-managment-user-name";
    private static readonly PASSWORD_KEY = "eu4-lobby-managment-user-password";

    private panel: HTMLDivElement;
    private lobbiesPanel: HTMLDivElement;
    private system: LobbyRespository;
    private socketHandler: LobbyManagmentWebsocketHandler;

    private alliancePointsInstance: AlliancePoints;
    private selectedLobby: Lobby | null = null;

    constructor(socketUrl: string, game: Game, discord: Discord, private locProvider: LocalisationProvider) {
        const login = this.getLogin();
        this.system = new LobbyRespository();
        this.socketHandler = new LobbyManagmentWebsocketHandler(socketUrl, this.system, login, game, discord);
        const locUser = new class extends AbstractLocalisationUser {};
        locUser.setLocalisationProvider(locProvider);
        this.alliancePointsInstance = new AlliancePoints(locUser, game, discord, () => this.selectLobby(null), (lobby: Lobby) => {
            this.socketHandler.sendLocalLobbyToServer(lobby);
        });
        this.system.addStateChangeListener((lobbies) => {
            if (this.selectedLobby == null) {
                this.displayLobbies(this.system.getLobbies());
            } else {
                for (let lobby of lobbies) {
                    if (this.selectedLobby == lobby) {
                        this.alliancePointsInstance.displayLobby(lobby);
                    }
                }
            }
        });
        this.panel = document.createElement('div'); 
        this.panel.style.width = "100%";
        this.panel.style.height = "100%";
        this.panel.style.paddingBottom = "100px";
        this.panel.style.boxSizing = "border-box";
        this.lobbiesPanel = document.createElement('div');
        this.panel.appendChild(this.lobbiesPanel);
        this.lobbiesPanel.classList.add("lobbies-panel");
    }

    getPanel(): HTMLDivElement {
        return this.selectedLobby == null ? this.panel : this.alliancePointsInstance.getPanel();
    }

    private getLogin() {
        if (localStorage.getItem(LobbyManager.NAME_KEY) == null) {
            const userName = Math.random().toString(36).substring(16);
            const password = Math.random().toString(36).substring(7);
            localStorage.setItem(LobbyManager.NAME_KEY, userName);
            localStorage.setItem(LobbyManager.PASSWORD_KEY, password);
        }
        let name = localStorage.getItem(LobbyManager.NAME_KEY);
        let password = localStorage.getItem(LobbyManager.PASSWORD_KEY);
        return new Login(name!, password!);
    }

    private displayLobbies(lobbies: Lobby[]) {
        this.lobbiesPanel.innerHTML = "";
        lobbies.forEach(lobby => {
            this.lobbiesPanel.appendChild(this.fabricatePanelForLobby(lobby));
        });
        const pseudoButton = this.fabricateLobbyPanelSkeleton() 
        pseudoButton.classList.add("lobby-adder");
        pseudoButton.innerHTML = "+";
        pseudoButton.onclick = () => {  
            const popup = AppWrapper.getPopupContainer();
            const inputCombo = UIFactory.fabricateInputButtonCombo(["Lobby Name?", "Lobby Password?"], "Create", [false, false], ["", ""], (values) => {
                if (values[0].trim().length != 0 && this.system.getLobbies().find(lobby => lobby.login.name == values[0]) == null) {
                    const newLobby = new Lobby(new Login(values[0], values[1]), null, []);
                    this.system.addLobby(newLobby);
                    this.socketHandler.sendLocalLobbyToServer(newLobby);
                }
                popup.exitFunction();
            });
            popup.popup.appendChild(inputCombo);
        } 
        this.lobbiesPanel.appendChild(pseudoButton);
    }

    private selectLobby(lobby: Lobby | null) {
        this.selectedLobby = lobby;
        if (lobby != null) {
            this.panel.removeChild(this.lobbiesPanel);
            this.panel.appendChild(this.alliancePointsInstance.getPanel());
            this.alliancePointsInstance.displayLobby(lobby);
        } else {
            this.panel.removeChild(this.alliancePointsInstance.getPanel());
            this.panel.appendChild(this.lobbiesPanel);
            this.displayLobbies(this.system.getLobbies());
        }
    }

    private fabricatePanelForLobby(lobby: Lobby) {
        const wrapper = this.fabricateLobbyPanelSkeleton();
        const mainPanel = document.createElement('div');
        const namePanel = document.createElement('div');
        namePanel.innerHTML = lobby.login.name;
        namePanel.classList.add("lobby-main-title");
        wrapper.appendChild(mainPanel);
        mainPanel.appendChild(namePanel);
        wrapper.appendChild(this.fabricateSideBarForLobby(lobby));
        mainPanel.classList.add("lobby-main");
        const table = document.createElement('table');
        mainPanel.appendChild(table);
        if (!lobby.userIsAuthorizedToAccess()) {
            mainPanel.style.cursor = "not-allowed";
            const thinking = document.createElement('div');
            thinking.innerHTML = "🔒";
            mainPanel.appendChild(thinking);
            thinking.style.fontSize = "calc(2 * var(--big-font-size))";
            thinking.style.margin = "auto";
        } else {
            const passwordRow = UIFactory.fabricateLobbyPanelTableRow("Password", lobby.login.password ? lobby.login.password : UIFactory.HIDDEN, true);
            const skanderbegRow = UIFactory.fabricateLobbyPanelTableRow("Skanderbeg", lobby.hasSkanderbegIdentifier() ? lobby.getAssociatedSkanderbegIdentifier() : "-", false);
            const playersRow = UIFactory.fabricateLobbyPanelTableRow("Players", lobby.userIsAuthorizedToAccess() ? lobby.getCachedNumberOfEntries().toString()  : "?", false);
            [passwordRow, skanderbegRow, playersRow].forEach(row => table.appendChild(row));
            skanderbegRow.style.cursor = "pointer";
            skanderbegRow.onclick = () => {
                if (lobby.hasSkanderbegIdentifier()) {
                    window.open(new Skanderbeg(lobby.getAssociatedSkanderbegIdentifier()).getUrl());
                } else {
                    const popup = AppWrapper.getPopupContainer();
                    popup.popup.append(UIFactory.fabricateInputButtonCombo(["Enter the Skanderbeg Identifier?"], "💾", [false], [""], (values) => {
                        lobby.setSkanderbegIdentifier(values[0]);
                        popup.exitFunction();
                    }));
                }
            }
        }
        return wrapper;
    }

    private fabricateSideBarForLobby(lobby: Lobby) {
        const sidebar = document.createElement('div');
        sidebar.classList.add("lobby-sidebar"); 
        if (lobby.userIsAuthorizedToAccess()) {
            const symbols = ["📂", "⧉", UIFactory.RED_X];
            const actions = [
                () => {
                    this.selectLobby(lobby);
                },
                () => {
                    const child = new Lobby(new Login(lobby.login.name + "_2", lobby.login.password), null, []);
                    lobby.addChild(child);
                    child.setEntries(lobby.getEntries().map(entry => entry.clone()));
                    this.system.addLobby(child);
                },
                () => {
                    // TODO: ask for confirmation
                }
            ];
            for (let i = 0; i < symbols.length; i++) {
                const button = document.createElement("div");
                button.innerHTML = symbols[i];
                button.onclick = actions[i];
                sidebar.appendChild(button);
            }
        } else {
            const lock = document.createElement('div');
            lock.innerHTML = "🔓"
            sidebar.appendChild(lock);
            lock.onclick = () => {
                const popup = AppWrapper.getPopupContainer();
                const inputCombo = UIFactory.fabricateInputButtonCombo(["Password?"], "🔓", [true], [""], (values) => {
                    lobby.setPassword(values[0], false);
                    this.socketHandler.askForAccessToLobby(lobby, values[0]);
                    popup.exitFunction();
                });
                popup.popup.appendChild(inputCombo);
                
            }
        }
        return sidebar;
    }

    private fabricateLobbyPanelSkeleton() {
        const div = document.createElement('div');
        div.classList.add("lobby-wrapper");
        return div;
    }
}