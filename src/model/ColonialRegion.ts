import { IHasImage } from "./IHasImage";
import { IHasLocalisableName } from "./IHasName";
import { AbstractLocalisationUser } from "./localisation/AbstractLocalisationUser";

export class ColonialRegion implements IHasLocalisableName {

    constructor(private name: string, private color: {r: number, g: number, b: number}) {

    }

    getName(localisationUser: AbstractLocalisationUser): string {
        return localisationUser.localise(this.name);
    }

    getColor() {
        return this.color;
    }
}