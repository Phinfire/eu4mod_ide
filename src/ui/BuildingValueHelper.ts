import { Constants } from "../Constants";
import { Game } from "../model/Game";
import { TradeGood } from "../model/TradeGood";
import { ITabApp } from "./ITabApp";

export class BuildingValueHelper implements ITabApp {

    private panel: HTMLDivElement;

    private parameters;

    constructor(private game: Game) {
        this.panel = document.createElement('div');
        this.panel.style.display = 'flex';
        this.panel.style.flexDirection = "row";
        this.parameters = {
            tradeGood: this.game.getAllTradeGoods(false,true).find(tg => tg.getName() == "unknown")!,
            localAutonomy: 0.5,
            localProductionEfficiencyModifier: 0.5,
            productionEfficiencyModifier: 0.2,
            tradeEfficiencyModifier: 0.4,
            tradeControl: 0.9,
            goodsProducedModifier: 0
        };
    }

    public getPanel(): HTMLDivElement {
        this.refresh();
        return this.panel;
    }
    
    private refresh() {
        this.panel.innerHTML = "";
        this.panel.appendChild(this.makeTable());
    }

    private makeTable() {
        const table = document.createElement('table');
        const header = document.createElement('tr');
        table.appendChild(header);
        const row = document.createElement('tr');
        table.appendChild(row);
        header.appendChild(document.createElement('th'));
        const appendHeaderCell = (imageSrc: string) => {
            const image = document.createElement('img');
            image.src = Constants.getGfx("interface/" + imageSrc + ".webp");
            const th = document.createElement('th');
            th.classList.add("payoffTableHeaderCell");
            image.draggable = false;
            header.appendChild(th).appendChild(image);
            return th;
        }
        const appendCell = (text: string) => {
            const td = document.createElement('td');
            td.style.textAlign = "center";
            td.style.verticalAlign = "middle";
            td.classList.add("payoffTableNumberCell");
            row.appendChild(td).appendChild(document.createTextNode(text));
            return td;
        }
        for (let icon of ["local_autonomy","local_production_efficiency", "production_efficiency", "trade_efficiency"].map(name => "ideas_EU4/" + name)) {
            appendHeaderCell(icon);
        }
        const cell = appendHeaderCell("privileges/privilege_ducats");
        const gap = "96px";
        cell.style.paddingLeft = gap;
        appendHeaderCell("icon_time");
        const goodTd = document.createElement('td');
        goodTd.appendChild(this.parameters.tradeGood.makeImage());
        goodTd.onclick = () => {
            const currentTradeGoodIndex = this.game.getAllTradeGoods(false,true).indexOf(this.parameters.tradeGood);
            const newTradeGoodIndex = (currentTradeGoodIndex + 1) % this.game.getAllTradeGoods(false,true).length;
            this.parameters.tradeGood = this.game.getAllTradeGoods(false,true)[newTradeGoodIndex];
            this.refresh();
        };
        row.appendChild(goodTd);
        let i = 0;
        for (let value of [this.parameters.localAutonomy, this.parameters.localProductionEfficiencyModifier, this.parameters.productionEfficiencyModifier, this.parameters.tradeEfficiencyModifier]) {
            const indicator = i == 0 ? "" : "+";
            i++;
            const valueString = indicator + 100 * value + "%";
            appendCell(valueString);
        }
        const yearlyIncome = this.calculateExtraYearlyIncome(this.parameters.tradeGood);
        if (Number.isFinite(yearlyIncome) && yearlyIncome > 0) {
            const incomeCell = appendCell(yearlyIncome.toFixed(1));
            incomeCell.style.paddingLeft = gap;
            const yearsToBuild = 5
            const years = yearsToBuild + 500 / yearlyIncome;
            appendCell(years.toFixed(1) + " years");
        }
        return table;
    }

    private makeDebugTable(tuples: {good: TradeGood, yearlyIncome: number}[]) {
        const table = document.createElement('table');
        const header = document.createElement('tr');
        table.appendChild(header);
        const headerImage = document.createElement('th');
        headerImage.style.paddingRight = "64px";
        header.appendChild(headerImage);
        header.appendChild(document.createElement('th')).textContent = 'Years to pay off';
        for (let tuple of tuples) {
            const row = document.createElement('tr');
            table.appendChild(row);
            const image = tuple.good.makeImage();
            image.style.width = "32px";
            image.style.height = "32px";
            row.appendChild(document.createElement('td')).appendChild(image);
            const years = 500 / tuple.yearlyIncome;
            row.appendChild(document.createElement('td')).textContent = years.toFixed(2);
        }
        table.style.paddingLeft = "32px";
        table.style.paddingRight = "32px";
        return table;   
    }

    // TODO: move outside ui
    private calculateExtraYearlyIncome(tradeGood: TradeGood) {
        const localAutonomy = 0; // TODO; half of autonmy mapped to 0-1
        const localProductionEfficiency = 1.2;
        const productionEfficiency = 1.5;
        const tradeEfficiency = 1.4;
        const tradeControl = 0.9;
        const goodsProduced = 1;
        const yearlyIncome = goodsProduced * tradeGood.getBasePrice() * ((1 - localAutonomy) * localProductionEfficiency * productionEfficiency + tradeEfficiency * tradeControl);
        return yearlyIncome;
    }

     
}