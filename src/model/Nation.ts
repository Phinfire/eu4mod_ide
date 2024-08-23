import { Game } from "./Game";
import { ILocalizationProvider } from "./ILocalizationProvider";
import { Language } from "./Language";
import { NationalIdeaSet } from "./NationalIdeaSet";

export class Nation {

    constructor(private tag: string, private ideas: NationalIdeaSet, private localizationProvider: ILocalizationProvider) {

    }

    getFlagUrl() {
        return `http://codingafterdark.de/ide/gfx/flags/${this.tag}.png`;
    }

    getNameinLanguage(language: Language) {
        return this.localizationProvider.localize(this.tag, language);
    }
    
    getAdjectiveinLanguage(language: Language) {
        return this.localizationProvider.localize(`${this.tag}_ADJ`, language);
    }

    getTag() {
        return this.tag;
    }

    getIdeas() {
        return this.ideas;
    }
}