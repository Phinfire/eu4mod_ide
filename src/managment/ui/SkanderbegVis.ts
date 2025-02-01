import { AbstractLocalisationUser } from "../../model/localisation/AbstractLocalisationUser";
import { LocalisationProvider } from "../../model/localisation/LocalisationProvider";
import { Skanderbeg } from "../../skanderbeg/Skanderbeg";
import { ITabApp } from "../../ui/ITabApp";
import { Plot } from "../../vis/Plot";
import { Point } from "../../vis/Point";

export class SkanderbegVis implements ITabApp {

    private panel: HTMLDivElement;

    constructor(locProvider: LocalisationProvider) {
        const locUser = new class extends AbstractLocalisationUser {};
        locUser.setLocalisationProvider(locProvider);
        this.panel = this.buildUI();
        this.display(new Skanderbeg("10f0e9"));
    }

    private buildUI() {
        const panel = document.createElement('div');
        panel.style.width = "100%";
        panel.style.height = "100%";
        return panel;
    }

    getPanel(): HTMLDivElement {
        return this.panel;
    }

    private display(skanderbeg: Skanderbeg) {
        skanderbeg.getPlayerSkanderNations().then(playerNations => {
            const points = [];
            for (let nation of playerNations) {
                const incomeStates = nation.getValue("income_stats");
                for (let key in incomeStates) {
                    points.push(new Point(parseInt(key), incomeStates[key], nation.getColorString(), ""));
                }
            }
            new Plot(this.panel, points);
        });
    }

}