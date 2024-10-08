import { ITabApp } from "./ITabApp";

export class AppWrapper {

    private wrapperDiv: HTMLDivElement;
    private tabsDiv: HTMLDivElement;
    private appDiv: HTMLDivElement;

    constructor(parent: HTMLElement, tabGenerators: Map<string, () => ITabApp>) {
        this.wrapperDiv = document.createElement('div');
        this.tabsDiv = document.createElement('div');
        this.appDiv = document.createElement('div');
        this.wrapperDiv.classList.add("app-inner-wrapper");
        this.tabsDiv.classList.add("app-tab-panel");
        this.appDiv.classList.add("app-content-panel");
        parent.appendChild(this.wrapperDiv);
        this.wrapperDiv.appendChild(this.tabsDiv);
        this.wrapperDiv.appendChild(this.appDiv);
        for (let tab of tabGenerators.keys()) {
            this.createTab(tab, tabGenerators.get(tab)!);
        }
        (this.tabsDiv.children[0]! as HTMLDivElement).click();
    }

    private createTab(label: string, generator: () => ITabApp) {
        const tab = document.createElement('div');
        tab.textContent = label;
        tab.classList.add("app-tab");
        this.tabsDiv.appendChild(tab);
        tab.addEventListener('click', () => {
            this.appDiv.innerHTML = "";
            const app = generator();
            this.appDiv.appendChild(app.getPanel());
            tab.parentElement!.querySelectorAll('.app-tab').forEach((tab) => {
                tab.classList.remove('app-tab-selected');
            });
            tab.classList.add('app-tab-selected');
        });
    }
}