import { Constants } from "../Constants";
import { Game } from "./Game";
import { INation } from "./INation";
import { AbstractLocalisationUser } from "./localisation/AbstractLocalisationUser";
import { NationalIdeaSet } from "./NationalIdeaSet";

export class OverrideNation implements INation {

    static dummyNation: OverrideNation | null = null;

    public static fabricateDummyNation(name: string, game: Game) {
        return new OverrideNation("REB", name + "?", name, "Rebel", game.getNationByTag("GER")!.getIdeas());
    }

    constructor(private tag: string, private name: string, private alias: string, private adjective: string, private ideas: NationalIdeaSet) {
    }

    getAlias(): string {
        return this.alias;
    }

    makeImage(): HTMLImageElement {
        const url = Constants.getGfx("flags/" + this.tag + ".webp");
        const img = document.createElement("img");
        img.src = url;
        return img;
    }

    getName(localisationUser: AbstractLocalisationUser): string {
        return this.name;
    }

    getAdjectiveinLanguage(localisationUser: AbstractLocalisationUser): string {
        return this.name + "ian"
    }

    getTag(): string {
        return this.tag;
    }
    
    getIdeas(): NationalIdeaSet {
        return this.ideas;
    }
}
