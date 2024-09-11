import { ILocalisationProvider } from "../model/localisation/ILocalizationProvider";
import { Language } from "../model/localisation/Language";
import { Guesser } from "./INationGuesser";

export class NationGuesser implements Guesser {

    private cachedKeys: string[] = [];

    constructor(private locProvider: ILocalisationProvider) {

    }
    
    public guessNationTag(name: string): string | null {
        if (!this.locProvider.isReady()) {
            throw new Error("Localisation provider not ready");
        }
        if (this.cachedKeys.length == 0) {
            this.cachedKeys = this.locProvider.getKeysThatCouldTheoreticallyBeTags();
        }
        for (const key of this.cachedKeys) {
            const nameLower = name.toLowerCase();
            for (const language of [Language.ENGLISH, Language.GERMAN]) {
                const value = this.locProvider.localize(key, language);
                const valueLower = value.toLowerCase();
                if (valueLower == nameLower || valueLower.startsWith(nameLower)) {
                    return key;
                }
            }
        }
        return null;
    }
}