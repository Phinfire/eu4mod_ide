import { Constants } from "../Constants";
import { AbstractLocalisationUser } from "../model/localisation/AbstractLocalisationUser";
import { Idea } from "../model/Idea";
import { NationalIdeaSet } from "../model/NationalIdeaSet";
import { TooltipManager } from "./TooltipManager";
import { Nation } from "../model/Nation";
import { setupCoatOfArmsPolygonClipPath } from "../utils";

export class NationIdeasPanel extends AbstractLocalisationUser {

    private panel: HTMLDivElement;
    private tableRows: HTMLTableRowElement[] = [];
    private flagImage: HTMLImageElement;
    private titlePanel: HTMLDivElement;
    private namePanel: HTMLDivElement;
    private tagPanel: HTMLDivElement;

    private modifiableIdeaSet: NationalIdeaSet | null = null;

    constructor() {
        super();
        this.panel = document.createElement("div");
        this.panel.classList.add("national-ideas-panel");
        const upperPanel = document.createElement("div");
        this.panel.appendChild(upperPanel);
        const flagPanel = document.createElement("div");
        flagPanel.classList.add("national-ideas-panel-top-left");
        upperPanel.appendChild(flagPanel);
        const titlesAndTablesPanel = document.createElement("div");
        upperPanel.appendChild(titlesAndTablesPanel);
        titlesAndTablesPanel.classList.add("national-idea-panel-top-right");
        const titlePanel = document.createElement("div");
        this.titlePanel = titlePanel;
        titlePanel.textContent = "";
        const tablePanel = document.createElement("div");
        titlePanel.classList.add("national-ideas-panel-top-title");
        tablePanel.classList.add("national-ideas-panel-top-content");
        titlesAndTablesPanel.appendChild(titlePanel);
        titlesAndTablesPanel.appendChild(tablePanel);

        upperPanel.classList.add("national-ideas-panel-top");
        this.flagImage = document.createElement("img");
        setupCoatOfArmsPolygonClipPath(this.flagImage);
        this.flagImage.src = Constants.getGfx("flags/nationalist_rebels.png");
        flagPanel.appendChild(this.flagImage);
        this.namePanel = document.createElement("div");
        flagPanel.appendChild(this.namePanel);
        this.tagPanel = document.createElement("div");
        flagPanel.appendChild(this.tagPanel);
        this.namePanel.classList.add("nation-ideas-panel-name");
        this.tagPanel.classList.add("nation-ideas-panel-tag");

        const emptyIdeaMap = new Map<string, string>();
        emptyIdeaMap.set("ae_impact", "0");
        const emptyIdea = new Idea("place_holder", emptyIdeaMap);

        const tradtionsTable = document.createElement("table");
        tablePanel.appendChild(tradtionsTable);
        const traditionsRow = document.createElement("tr");
        tradtionsTable.appendChild(traditionsRow);
        for (let i = 0; i < 2; i++) {
            this.makeImageTableCell(emptyIdea, traditionsRow, false);
        }

        const table = document.createElement("table");
        const row = document.createElement("tr");

        for (let i = 0; i < 7; i++) {
            this.makeImageTableCell(emptyIdea, row, false);
        }
        table.appendChild(row);
        tablePanel.appendChild(table);
        
        const ambitionsTable = document.createElement("table");
        tablePanel.appendChild(ambitionsTable);
        const ambitionsRow = document.createElement("tr");
        ambitionsTable.appendChild(ambitionsRow);
        this.makeImageTableCell(emptyIdea, ambitionsRow, false);
        const titles = ["Traditions", "Ideas", "Ambition"];
        tradtionsTable.style.marginRight = "32px";
        ambitionsTable.style.marginLeft = "32px";
        const subTables = [tradtionsTable, table, ambitionsTable];
        for (let i = 0; i < 3; i++) {
            const footer = document.createElement("tr");
            const footerCell = document.createElement("th");
            footerCell.textContent = titles[i];
            footerCell.classList.add("nation-ideas-panel-footer");
            footer.appendChild(footerCell);
            subTables[i].appendChild(footer);
        }
        this.tableRows = subTables.map(table => table.firstChild as HTMLTableRowElement);
        const contentPanel = document.createElement("div");
        this.panel.appendChild(contentPanel);
    }

    public getPanel() {
        return this.panel;
    }

    public show(ideas: NationalIdeaSet, nation: Nation, flagUrl: string) {
        this.modifiableIdeaSet = ideas;
        this.flagImage.src = flagUrl;
        this.namePanel.innerHTML = nation.getName(this);
        this.tagPanel.innerHTML = nation.getTag().toUpperCase();
        this.titlePanel.textContent = nation.getAdjectiveinLanguage(this) + " Ideas";
        const traditions = [ideas.getFirstTradition(), ideas.getSecondTradition()];
        const ideaArr = ideas.getIdeas();
        this.tableRows.forEach(row => row.innerHTML = "");
        traditions.forEach(tradition => {
            this.makeImageTableCell(tradition, this.tableRows[0], false);
        });
        ideaArr.forEach(idea => {
            this.makeImageTableCell(idea, this.tableRows[1], true);
        });
        this.makeImageTableCell(ideas.getAmbition(), this.tableRows[2], false);
    }

    private makeImageTableCell(idea: Idea, row: HTMLTableRowElement, descAndTitle: boolean) {
        const cell = document.createElement("td");
        const image = document.createElement("img");
        image.src = idea.getImageUrl();
        image.classList.add("nation-ideas-panel-img");
        cell.style.width = "64px";
        cell.style.height = "64px";
        image.addEventListener("dragstart", (event) => {
            event.preventDefault();
        });
        cell.appendChild(image);
        row.appendChild(cell);

        const tooltipManager = TooltipManager.getInstance();
        let tooltip = Array.from(idea.getModifierAssignments().entries()).map(entry => "<b>" + this.localise(entry[0]) + "</b>: " + entry[1]).join("<br>");
        if (descAndTitle) {
            tooltip = idea.getName(this) + "<br><br>" + tooltip + "<br><br>" + idea.getDescription(this);
            image.onmousemove = (event) => tooltipManager.showTooltip(event, tooltip.trim());
        }
        image.onmousemove = (event) => tooltipManager.showTooltip(event, tooltip.trim());
        image.onmouseleave = () => tooltipManager.hideTooltip();
        return image;
    }
}