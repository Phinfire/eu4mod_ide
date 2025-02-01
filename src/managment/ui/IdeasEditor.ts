import { Game } from "../../model/Game";
import { AbstractLocalisationUser } from "../../model/localisation/AbstractLocalisationUser";
import { LocalisationProvider } from "../../model/localisation/LocalisationProvider";
import { NationalIdeaSet } from "../../model/NationalIdeaSet";
import { ITabApp } from "../../ui/ITabApp";
import { NationIdeasPanel } from "../../ui/NationIdeasPanel";

export class IdeasEditor implements ITabApp {

    public panel: HTMLDivElement | null = null;

    private ideas: NationalIdeaSet;

    private locUser: AbstractLocalisationUser;

    constructor(private game: Game, private locProvider: LocalisationProvider) {
        this.locUser = new class extends AbstractLocalisationUser {};
        this.locUser.setLocalisationProvider(locProvider);
        this.ideas = game.getNationByTag("FRA")!.getIdeas();
    }   

    getPanel(): HTMLDivElement {
        if (this.panel == null) {
            this.panel = this.fabricateTable();
        }
        return this.panel!;
    }

    private fabricateTable() {
        const div = document.createElement("div");
        const ideas = [this.ideas.getFirstTradition(), this.ideas.getSecondTradition()].concat(this.ideas.getIdeas()).concat([this.ideas.getAmbition()]);
        const preBorderIndices = [2,9]
        console.log(ideas);
        for (let i = 0; i < ideas.length; i++) {
            const row = document.createElement("div");
            row.classList.add("ideas-editor-row");
            row.appendChild(ideas[i].makeImage());
            const keyDiv = document.createElement("div");
            keyDiv.style.width = "50%";
            keyDiv.innerHTML = Array.from(ideas[i].getModifierAssignments().keys()).join("<br>");
            const valDiv = document.createElement("div");
            valDiv.style.width = "10%";
            valDiv.innerHTML = Array.from(ideas[i].getModifierAssignments().values()).join("<br>");
            keyDiv.classList.add("ideas-editor-row-modifier-name");
            valDiv.classList.add("ideas-editor-row-modifier-value");
            row.appendChild(keyDiv);
            row.appendChild(valDiv);
            div.appendChild(row);
        }
        return div;
    }
    
}