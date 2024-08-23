import { Constants } from "../Constants";
import { NationalIdeaSet } from "../model/NationalIdeaSet";

export class NationIdeasPanel {

    private panel: HTMLDivElement;
    private cellImages: HTMLImageElement[] = [];
    private flagImage: HTMLImageElement;
    private titlePanel: HTMLDivElement;

    private modifiableIdeaSet: NationalIdeaSet | null = null;

    constructor() {
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
        this.setupCoatOfArmsPolygonClipPath(this.flagImage);
        this.flagImage.src = Constants.ROOT_GFX_URL + "flags/MLC.png";
        flagPanel.appendChild(this.flagImage);

        const tradtionsTable = document.createElement("table");
        tablePanel.appendChild(tradtionsTable);
        const traditionsRow = document.createElement("tr");
        tradtionsTable.appendChild(traditionsRow);
        for (let i = 0; i < 2; i++) {
            this.cellImages.push(this.makeImageTableCell(Constants.ROOT_GFX_URL + "ideas/ae_impact.png", traditionsRow));
        }

        const table = document.createElement("table");
        const row = document.createElement("tr");

        for (let i = 0; i < 7; i++) {
            this.cellImages.push(this.makeImageTableCell(Constants.ROOT_GFX_URL + "ideas/ae_impact.png", row));
        }
        table.appendChild(row);
        tablePanel.appendChild(table);
        
        const ambitionsTable = document.createElement("table");
        tablePanel.appendChild(ambitionsTable);
        const ambitionsRow = document.createElement("tr");
        ambitionsTable.appendChild(ambitionsRow);
        this.cellImages.push(this.makeImageTableCell(Constants.ROOT_GFX_URL + "ideas/ae_impact.png", ambitionsRow));
        const titles = ["Traditions", "Ideas", "Ambition"];
        const tables = [tradtionsTable, table, ambitionsTable];
        tradtionsTable.style.marginRight = "32px";
        ambitionsTable.style.marginLeft = "32px";
        for (let i = 0; i < 3; i++) {
            const footer = document.createElement("tr");
            const footerCell = document.createElement("th");
            footerCell.textContent = titles[i];
            footerCell.classList.add("nation-ideas-panel-footer");
            footer.appendChild(footerCell);
            tables[i].appendChild(footer);
        }
        table

        const contentPanel = document.createElement("div");
        this.panel.appendChild(contentPanel);
    }

    public getPanel() {
        return this.panel;
    }

    public show(ideas: NationalIdeaSet, name: string, flagUrl: string) {
        this.modifiableIdeaSet = ideas;
        this.flagImage.src = flagUrl;
        this.titlePanel.textContent = name + " Ideas";
        const ideaAray = [ideas.getFirstTradition(), ideas.getSecondTradition()].concat(ideas.getIdeas()).concat([ideas.getAmbition()]);
        for (let i = 0; i < ideaAray.length; i++) {
            const firstModifierName = ideaAray[i].getModifierAssignments().keys().next().value;
            this.cellImages[i].src = Constants.ROOT_GFX_URL + "ideas/" + firstModifierName + ".png";
        }
    }

    private makeImageTableCell(imageUrl: string, row: HTMLTableRowElement) {
        const cell = document.createElement("td");
        const image = document.createElement("img");
        image.src = imageUrl;
        image.classList.add("nation-ideas-panel-img");
        cell.style.width = "64px";
        cell.style.height = "64px";
        image.addEventListener("dragstart", (event) => {
            event.preventDefault();
        });
        cell.appendChild(image);
        row.appendChild(cell);
        return image;
    }

    private setupCoatOfArmsPolygonClipPath(flag: HTMLImageElement) {
        const leftRightCutoff = 0;
        const startCurve = 50;
        const halfCurveSteps = 10;
        const clipPolyPoints = [];
        const halfWidth = 50 - leftRightCutoff; 
        clipPolyPoints.push({x: leftRightCutoff, y: 0});
        clipPolyPoints.push({x: 100 - leftRightCutoff, y: 0});
        clipPolyPoints.push({x: 100 - leftRightCutoff, y: startCurve});
        const circleCenter = {x: 50, y: startCurve};
        const circleRadius = Math.min(halfWidth, 100 - startCurve);
        for (let i = 1; i <= halfCurveSteps; i++) {
            //const y = startCurve + i * (100 - startCurve) / halfCurveSteps;
            //const x = 100 - leftRightCutoff - Math.pow(i / halfCurveSteps,4) * halfWidth;
            const y = circleCenter.y + Math.sin(i / halfCurveSteps * Math.PI / 2) * circleRadius;
            const x = circleCenter.x + Math.cos(i / halfCurveSteps * Math.PI / 2) * circleRadius
            clipPolyPoints.push({x: x, y: y});
        }
        const length = clipPolyPoints.length;
        for (let i = length -1 ; i > 1; i--) {
            const partner: { x: number, y: number } = clipPolyPoints[i];
            clipPolyPoints.push({x: (100-partner.x), y: partner.y});
        }
        //clipPolyPoints.push({x: leftRightCutoff, y: startCurve});
        flag.style.clipPath = "polygon(" + clipPolyPoints.map(p => p.x + "% " + p.y + "%").join(",") + ")";
        flag.addEventListener("dragstart", (event) => {
            event.preventDefault();
        });
    }
}