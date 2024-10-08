import { ColonialRegion } from "./ColonialRegion";
import { INation } from "./INation";
import { AbstractLocalisationUser } from "./localisation/AbstractLocalisationUser";
import { Nation } from "./Nation";
import { NationalIdeaSet } from "./NationalIdeaSet";

export class ColonialNation implements INation {

    constructor(private overlord: Nation, private region: ColonialRegion) {

    }

    makeImage(): HTMLImageElement {
        // image consists of the right half of the overlord's  flag and the left in the color of the region
        const img = this.overlord.makeImage();
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(img, 64, 0, 64, 128, 0, 0, 64, 128);
            const color = this.region.getColor();
            ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            ctx.fillRect(64, 0, 64, 128);
        }
        const result = document.createElement("img");
        result.src = canvas.toDataURL();
        return result;
    }
    
    getName(localisationUser: AbstractLocalisationUser): string {
        throw new Error("Method not implemented.");
    }
    getAdjectiveinLanguage(localisationUser: AbstractLocalisationUser): string {
        throw new Error("Method not implemented.");
    }
    getTag(): string {
        throw new Error("Method not implemented.");
    }
    getIdeas(): NationalIdeaSet {
        throw new Error("Method not implemented.");
    }

    getAlias(): string {
        return this.overlord.getAlias() + " Colony";
    }
}