import { Constants } from "../Constants";
import { IHasImage } from "./IHasImage";
import { AbstractLocalisationUser } from "./localisation/AbstractLocalisationUser";

export class Idea implements IHasImage {

    constructor(private localizationKey: string, private modifierAssignments: Map<string,string>) {
        if (Array.from(modifierAssignments.keys()).map(k => k.toLowerCase()).join("").indexOf("directions") != -1) {
            console.log("Idea with directions: " + localizationKey);
        }
    }
    
    getImageUrl(): string {
        const firstModifierName = this.getModifierAssignments().keys().next().value;
        return Constants.getGfx("ideas/" + firstModifierName + ".webp");
    }

    makeImage(): HTMLImageElement {
        const img = document.createElement("img");
        img.src = this.getImageUrl();
        return img;
    }

    getModifierAssignments() {
        return this.modifierAssignments;
    }

    getName(localisationProvider: AbstractLocalisationUser) {
        return localisationProvider.localise(this.localizationKey);
    }

    getDescription(localisationProvider: AbstractLocalisationUser) {
        return localisationProvider.localise(this.localizationKey + "_desc");
    }
}