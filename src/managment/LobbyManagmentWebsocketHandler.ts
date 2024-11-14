import { Game } from "../model/Game";
import { OverrideNation } from "../model/OverrideNation";
import { Login } from "./ILogin";
import { Lobby } from "./lobbies/Lobby";
import { LobbyRespository } from "./LobbyRepository";
import { Discord } from "./points/Discord";
import { Entry, SendableEntry } from "./points/Entry";
import { WebSocketWrapper } from "./WebsocketWrapper";

enum ServerStatus {
    NONE,
    OK,
    FAIL,
    SERVER_CLOSED
}

enum MessageType {    

    REQUEST_LOBBIES = "intro",
    DASHBOARD_DATA = "dashboard",

    CHECKIN = "checkin",
    REQUESTING_DATA = "request",
    DATA_DELIVERY = "delivery",
    DISCORD_DATA = "discord", // TODO
    CHECKIN_FAIL = "checkinfail"
}

interface Message {
    type: MessageType;
    userLogin: Login;
    lobbyLogin: Login;
    lobbies: Lobby[];
    entries: SendableEntry[] | null;
}

export class LobbyManagmentWebsocketHandler {
    
    private wsWrapper: WebSocketWrapper;
    private listeners: ((state: ServerStatus) => void)[] = [];
    private messageListeners: ((message: any) => void)[] = [];
    
    constructor(socketUrl: string, private localLobbies: LobbyRespository, private userLogin: Login, private game: Game, private discord: Discord) {
        const ws = new WebSocket(socketUrl);
        this.wsWrapper = new WebSocketWrapper(ws, (wsWrapper: WebSocketWrapper) => {
            wsWrapper.setOnMessage((event: MessageEvent) => {
                const message = this.parseMessage(event);
                if ( message.type == MessageType.CHECKIN_FAIL) {
                    // TODO: set password back to null
                    const targetLobby = this.localLobbies.getLobbies().find(lobby => lobby.login.name == message.lobbyLogin.name)!;
                    targetLobby.setPassword(null, false);
                    //this.listeners.forEach(listener => listener(ServerStatus.FAIL));
                } else if ( message.type == MessageType.DASHBOARD_DATA) {
                    this.localLobbies.setLobbies(message.lobbies);
                    for (let lobby of this.localLobbies.getLobbies().filter(lobby => lobby.userIsAuthorizedToAccess())) {
                        this.sendLobbyLevelAuthorizedMessage(MessageType.REQUESTING_DATA, lobby.login, []);
                    }
                } else if (message.type == MessageType.DATA_DELIVERY) {
                    const targetLobby = this.localLobbies.getLobbies().find(lobby => lobby.login.name == message.lobbyLogin.name)!;
                    targetLobby.setEntries(message.entries!);
                    if (!targetLobby.userIsAuthorizedToAccess()) {
                        this.localLobbies.unlockLobby(targetLobby, message.lobbyLogin.password!);
                    }
                    localLobbies.alertListeners(targetLobby);
                } else {
                    throw new Error("Unexpected message type: " + event.data. message.type);
                }
            });
            this.wsWrapper.rawSend(JSON.stringify({type: MessageType.REQUEST_LOBBIES, userLogin: this.userLogin, lobbyLogin: new Login("",""), lobbies: [], entries: []}));
        });
    }
    
    public sendLobbyLevelAuthorizedMessage(type: MessageType, lobbyLogin: Login, entries: SendableEntry[]) {
        this.wsWrapper.rawSend(JSON.stringify({type: type, userLogin: this.userLogin, lobbyLogin: lobbyLogin, lobbies: [], entries: entries}));
    }

    public addSocketStateListener(listener: (state: ServerStatus) => void) {
        this.listeners.push(listener);
    }

    public addMessageListener(listener: (message: any) => void) {
        this.messageListeners.push(listener);
    }

    public sendLocalLobbyToServer(lobby: Lobby) {
        this.sendLobbyLevelAuthorizedMessage(MessageType.DATA_DELIVERY, lobby.login, lobby.getEntries().map(entry => entry.toSendable()));
    }

    public askForAccessToLobby(lobby: Lobby, password: string) {
        this.sendLobbyLevelAuthorizedMessage(MessageType.REQUESTING_DATA, new Login(lobby.login.name, password), []);
    }

    private parseMessage(event: MessageEvent): Message {
        const parsed = JSON.parse(event.data);
        return {
            type: parsed.type,
            userLogin: Login.fromJson(parsed.userLogin),
            lobbyLogin: Login.fromJson(parsed.lobbyLogin),
            lobbies: parsed.lobbies ? parsed.lobbies.map((lobby: any) => Lobby.fromJson(lobby)) : [],
            entries: parsed.entries ? parsed.entries.map((entry: any) => Entry.fromSendable(entry as SendableEntry, this.game, this.discord)) : []
        };
    }
}