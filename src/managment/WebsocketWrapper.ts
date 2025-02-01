import { SendableEntry } from "./points/Entry";

export class WebSocketWrapper {

    constructor(private socket: WebSocket | null, onReady: (wrapper: WebSocketWrapper) => void = () => {}) {
        this.socket = socket;
        const outerThis = this;
        if (this.socket) {
            this.socket.onopen = function() {
                onReady(outerThis);
            };
                
            this.socket.onclose = function() {};

            this.socket.onerror = function(event) {
                console.log(event);
            };
        } else {
            onReady(outerThis);
        }
    }

    public setOnMessage(callback: (event: MessageEvent) => void): void {
        if (this.socket) {
            this.socket.onmessage = callback;
        }
    }

    public rawSend(message: string): void {
        if (this.socket) {
            this.socket.send(message);
        }
    }

    public isReallyConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }
}