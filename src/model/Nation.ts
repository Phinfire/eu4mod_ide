import { Constants } from "../Constants";
import { Game } from "./Game";
import { IHasImage } from "./IHasImage";
import { IHasLocalisableName } from "./IHasName";
import { INation } from "./INation";
import { AbstractLocalisationUser } from "./localisation/AbstractLocalisationUser";
import { ILocalisationProvider } from "./localisation/ILocalizationProvider";
import { Language } from "./localisation/Language";
import { NationalIdeaSet } from "./NationalIdeaSet";

export class Nation implements INation {

    constructor(private tag: string, private alias: string, private ideas: NationalIdeaSet) {

    }

    getImageUrl() {
        return Constants.getGfx("flags/" + this.tag + ".webp");
    }
    
    public makeImage() {
        const img = document.createElement("img");
        img.src = this.getImageUrl();
        img.loading = "lazy";
        return img;
    }

    getAlias() {
        return this.alias;
    }

    getName(localisationUser: AbstractLocalisationUser) {
        return localisationUser.localise(this.tag);
    }
    
    getAdjectiveinLanguage(localisationUser: AbstractLocalisationUser) {
        return localisationUser.localise(`${this.tag}_ADJ`);
    }

    getTag() {
        return this.tag;
    }

    getIdeas() {
        return this.ideas;
    }
}