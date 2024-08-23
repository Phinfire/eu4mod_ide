import { Language } from "../model/Language";
import { Nation } from "../model/Nation";

export class NationTable {

    static readonly EMPTY_FILTER = "Type name here";

    private panel: HTMLDivElement;
    private tableElement: HTMLTableElement;
    private columns: number;
    private callback: (nation: Nation) => void;
    private tbody: HTMLTableSectionElement;

    private filterString = "";
    private allNations: Nation[] = [];

    constructor(columns: number, selectionCallback: (nation: Nation) => void) {
        this.panel = document.createElement("div");
        this.panel.classList.add("nation-table-panel");
        this.columns = columns;
        this.callback = selectionCallback
        const top = document.createElement("div");
        top.classList.add("nation-table-panel-top");
        this.panel.appendChild(top);
        const filterInput = document.createElement("input");
        filterInput.classList.add("nation-table-panel-top-input");
        filterInput.type = "text";
        filterInput.placeholder = "Type name here";
        top.appendChild(filterInput);
        this.tableElement = document.createElement("table");
        this.panel.appendChild(this.tableElement);
        this.tableElement.classList.add("nation-table");
        this.tbody = document.createElement("tbody");
        this.tableElement.appendChild(this.tbody);
        filterInput.onfocus = () => {
            filterInput.placeholder = NationTable.EMPTY_FILTER;
            this.refreshFilterState();
        };
        filterInput.oninput = () => {
            this.filterString = filterInput.value;
            this.refreshFilterState();
        };
        filterInput.onblur = () => {
            filterInput.placeholder = NationTable.EMPTY_FILTER;
            this.refreshFilterState();
        };
    }

    public refreshFilterState() {
        this.tbody.innerHTML = "";
        let tr;
        const includedNations = this.allNations.filter(nation => this.filterString == NationTable.EMPTY_FILTER || nation.getNameinLanguage(Language.ENGLISH).toLowerCase().startsWith(this.filterString.toLowerCase()));
        for (let i = 0; i < includedNations.length; i++) {
            if (i % this.columns === 0) {
                tr = document.createElement("tr");
                this.tbody.appendChild(tr);
            }
            const td = document.createElement("td");
            const img = document.createElement("img");
            img.src = includedNations[i].getFlagUrl();
            img.style.width = "100%";
            img.style.height = "100%";
            td.style.width = 100 / this.columns + "%";
            td.style.height = "auto";
            td.appendChild(img);
            tr!.appendChild(td);
            img.onclick = () => {
                this.callback(includedNations[i]);
            };
        }
        if (includedNations.length % this.columns !== 0) {
            for (let i = includedNations.length % this.columns; i < this.columns; i++) {
                const td = document.createElement("td");
                td.style.width = 100 / this.columns + "%";
                td.style.height = "auto";
                tr!.appendChild(td);
            }
        }
    }

    public setNations(nations: Nation[]) {
        this.allNations = nations;
        this.filterString = NationTable.EMPTY_FILTER;
        this.refreshFilterState();
    }

    public getPanel() {
        return this.panel;
    }
}