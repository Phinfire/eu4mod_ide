import { SendableEntry } from "./points/Entry";

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

    public sendMessage(message: {type: string, lobbyID: string, password: string, data: SendableEntry[]}): void {
        if (this.socket) {
            this.socket.send(JSON.stringify(message));
        }
    }

    public isReallyConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    public sendImage(image: Blob): void {
        if (this.socket) {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.result && typeof reader.result === 'string') {
                    this.socket!.send(reader.result);
                }
            };
            reader.readAsDataURL(image);
        }
    }

    public sendCanvas(canvas: HTMLCanvasElement): void {
        canvas.toBlob((blob) => {
            if (blob) {
                this.sendImage(blob);
            }
        });
    }
}