import { ITabApp } from "../ui/ITabApp";
import { Lobby } from "./lobbies/Lobby";
import { WebSocketWrapper } from "./WebsocketWrapper";



export class LobbyRespository {

    private Lobbies: Lobby[] = [];
    private listeners: Map<number, (changedLobbies: Lobby[]) => void> = new Map();

    public setLobbies(lobbies: Lobby[]) {
        this.Lobbies = lobbies;
        this.listeners.forEach(listener => listener(this.Lobbies));
    }

    public addLobby(lobby: Lobby) {
        this.Lobbies.push(lobby);
        this.listeners.forEach(listener => listener([lobby]));
    }

    public unlockLobby(lobby: Lobby, password: string) {
        console.log("Unlocking lobby " + lobby.login.name);
        lobby.setPassword(password, true);
        this.listeners.forEach(listener => listener([lobby]));
    }

    public alertListeners(lobby: Lobby) {
        this.listeners.forEach(listener => listener([lobby]));
    }
    
    public getLobbies() {
        return this.Lobbies;
    }

    public addStateChangeListener(listener: (changedLobbies: Lobby[]) => void) {
        const id = Math.random();
        this.listeners.set(id, listener);
        return id;
    }

    public removeStateChangeListener(id: number) {
        this.listeners.delete(id);
    }
}