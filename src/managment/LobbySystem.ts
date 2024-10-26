import { WebSocketWrapper } from "./WebsocketWrapper";

class Lobby {

    constructor(public readonly identifier: string, public readonly password: string | null) {

    }
}

export class LobbySystem {

    Lobbies: Lobby[] = [];

    constructor(websocketWrapper: WebSocketWrapper, introData: string) {
        
    }
}