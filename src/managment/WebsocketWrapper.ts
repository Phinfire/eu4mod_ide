export class WebSocketWrapper {

    constructor(private socket: WebSocket | null, onReady: (wrapper: WebSocketWrapper) => void = () => {}) {
        this.socket = socket;
        const outerThis = this;
        if (this.socket) {
            this.socket.onopen = function() {
                console.log("WS CONNECTED");
                onReady(outerThis);
            };
                
            this.socket.onclose = function() {
                console.log("WS DISCONNECTED");
            };

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

    public sendMessage(message: string): void {
        if (this.socket) {
            this.socket.send(message);
        }
    }
}