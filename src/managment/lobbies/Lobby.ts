import { Login } from "../ILogin";
import { Entry } from "../points/Entry";

export class Lobby {

    private entries: Entry[] = [];

    private passwordReceivedFromServer = false;

    public static fromJson(lobbyJson: any): Lobby {
        return new Lobby(Login.fromJson(lobbyJson.login), lobbyJson.skanderbegIdentifier, lobbyJson.childLobbyNames);
    }

    constructor(public login: Login, private skanderbegIdentifier: string | null, private childLobbyNames: string[]) {
        if (login.password != null) {
            this.passwordReceivedFromServer = true;
        }
    }

    public toJson(): any {
        return {
            login: this.login.toJson(),
            skanderbegIdentifier: this.skanderbegIdentifier,
            childLobbyNames: this.childLobbyNames
        };
    }

    public userIsAuthorizedToAccess() {
        return this.login.password != null && this.hasServerPassword();
    }

    public setPassword(password: string | null, setByServer: boolean) {
        this.passwordReceivedFromServer = setByServer;
        this.login = new Login(this.login.name, password);
    }

    public setSkanderbegIdentifier(identifier: string) {
        this.skanderbegIdentifier = identifier;
    }

    public hasSkanderbegIdentifier() {
        return this.skanderbegIdentifier != null;
    }

    public getAssociatedSkanderbegIdentifier() {
        if (!this.hasSkanderbegIdentifier()) {
            throw new Error("Lobby " + Lobby.name  +" has no skanderbeg identifier");
        }
        return this.skanderbegIdentifier!;
    }

    public getChildLobbyNames() {
        return this.childLobbyNames;
    }

    public addChild(lobby: Lobby) {
        this.childLobbyNames.push(lobby.login.name);
    }

    public getCachedNumberOfEntries() {
        return this.entries.length;
    }

    public setEntries(entries: any[]) {
        this.entries = entries; 
    }

    public getEntries() {
        return this.entries;
    }

    public hasServerPassword() {
        return this.passwordReceivedFromServer;
    }
}