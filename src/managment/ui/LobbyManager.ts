import { ITabApp } from "../../ui/ITabApp";

export class LobbyManager implements ITabApp {

    private panel: HTMLDivElement;

    constructor() {
        this.panel = document.createElement('div');
    }

    getPanel(): HTMLDivElement {
        return this.panel;
    }
    
}