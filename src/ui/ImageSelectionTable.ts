import { IHasImage } from "../model/IHasImage";
import { IHasLocalisableName } from "../model/IHasName";
import { AbstractLocalisationUser } from "../model/localisation/AbstractLocalisationUser";
import { ILocalisationProvider } from "../model/localisation/ILocalizationProvider";

export class ImageSelectionTable<T extends IHasImage & IHasLocalisableName> extends AbstractLocalisationUser {

    static readonly EMPTY_FILTER = "Type name here";

    private panel: HTMLDivElement;
    private tableElement: HTMLTableElement;
    private columns: number;
    private callback: (selectedElement: T) => void;
    private contentPanel: HTMLDivElement;
    private panelTitlePanel: HTMLDivElement;
    private alreadyDisplayedNumberOfNations = 0;

    private panelTitle;
    private filterString = "";
    private allNations: T[] = [];

    constructor(panelTitle: string, columns: number, selectionCallback: (selectedElement: T) => void) {
        super();
        this.panelTitle = panelTitle;
        this.panel = document.createElement("div");
        const top = document.createElement("div");
        const filterInput = document.createElement("input");
        const refreshButton = document.createElement("div");
        this.tableElement = document.createElement("table");
        this.contentPanel = document.createElement("div");
        this.contentPanel.style.display = "flex";
        this.contentPanel.style.flexWrap = "wrap";
        this.panel.classList.add("nation-table-panel");
        const content = document.createElement("div");
        content.classList.add("nation-table-panel-content");
        this.columns = columns;
        this.callback = selectionCallback
        top.classList.add("nation-table-panel-top");
        this.panel.appendChild(top);
        this.panel.appendChild(content);
        this.panelTitlePanel = document.createElement("div");
        this.panelTitlePanel.classList.add("nation-table-panel-top-title");
        this.panelTitlePanel.textContent = panelTitle;
        top.appendChild(this.panelTitlePanel);
        filterInput.classList.add("nation-table-panel-top-input");
        filterInput.type = "text";
        filterInput.placeholder = "Type name here";
        top.appendChild(filterInput);
        content.appendChild(this.tableElement);
        this.tableElement.classList.add("nation-table");
        this.tableElement.appendChild(this.contentPanel);
        filterInput.onfocus = () => {
            filterInput.placeholder = ImageSelectionTable.EMPTY_FILTER;
            this.refreshFilterState();
        };
        filterInput.oninput = () => {
            this.filterString = filterInput.value;
            this.refreshFilterState();
        };
        filterInput.onblur = () => {
            filterInput.placeholder = ImageSelectionTable.EMPTY_FILTER;
            this.refreshFilterState();
        };
        refreshButton.classList.add("nation-table-panel-top-refresh");
        refreshButton.textContent = "X";
        refreshButton.onclick = () => {
            filterInput.value = "";
            this.filterString = "";
            this.refreshFilterState();
        };
        top.appendChild(refreshButton);
    }

    public refreshFilterState() {
        this.contentPanel.innerHTML = "";
        this.alreadyDisplayedNumberOfNations = 0;
        const includedNations = this.allNations.filter(nation => this.filterString == ImageSelectionTable.EMPTY_FILTER || nation.getName(this).toLowerCase().startsWith(this.filterString.toLowerCase()))
            .toSorted((a, b) => a.getName(this).localeCompare(b.getName(this)));
        this.panelTitlePanel.textContent = this.panelTitle + " (" + includedNations.length + ")";
        while(this.alreadyDisplayedNumberOfNations < includedNations.length) {
            const i = this.alreadyDisplayedNumberOfNations;
            const itemDiv = document.createElement("div");
            itemDiv.style.width = 100 / this.columns + "%";
            itemDiv.style.boxSizing = "border-box";
            const img = includedNations[i].makeImage();
            img.classList.add("nation-table-item-img");
            img.style.width = "100%";
            img.style.height = "auto";
            itemDiv.appendChild(img);
            img.onmouseup = (event) => {
                this.callback(includedNations[i]);
                event.stopPropagation();
            };
            this.contentPanel.appendChild(itemDiv);
            this.alreadyDisplayedNumberOfNations++;        
        }
    }

    public setLocalisationProvider(provider: ILocalisationProvider) {
        super.setLocalisationProvider(provider);
    }

    public setElements(nations: T[]) {
        this.allNations = nations;
        this.filterString = ImageSelectionTable.EMPTY_FILTER;
        this.refreshFilterState();
    }

    public getPanel() {
        return this.panel;
    }

    public setCallback(callback: (selectedElement: T) => void) {
        this.callback = callback;
    }
}