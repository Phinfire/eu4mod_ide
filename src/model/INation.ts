import { IHasImage } from "./IHasImage";
import { IHasLocalisableName } from "./IHasName";
import { AbstractLocalisationUser } from "./localisation/AbstractLocalisationUser";
import { NationalIdeaSet } from "./NationalIdeaSet";

export interface INation extends IHasImage, IHasLocalisableName {
    
    makeImage(): HTMLImageElement;

    getName(localisationUser: AbstractLocalisationUser): string;
    
    getAdjectiveinLanguage(localisationUser: AbstractLocalisationUser): string;

    getTag(): string;

    getIdeas(): NationalIdeaSet;
}