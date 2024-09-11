import { ILocalisationProvider } from "./ILocalizationProvider";
import { Language } from "./Language";

export abstract class AbstractLocalisationUser {

    private provider: ILocalisationProvider | null = null;
    private language: Language = Language.ENGLISH;

    public setLocalisationProvider(provider: ILocalisationProvider) {
        this.provider = provider;
    }

    public localise(key: string): string {
        if (this.provider == null) {
            return key;
        }
        const straightLookup = this.provider.localize(key, this.language);
        if (straightLookup !== key) {
            return straightLookup;
        }
        const upperLookup = this.provider.localize(key.toUpperCase(), this.language);
        if (upperLookup !== key.toUpperCase()) {
            return upperLookup;
        }
        const lookupWithModifierPrefix = this.provider.localize("MODIFIER_" + key.toUpperCase(), this.language);
        if (lookupWithModifierPrefix !== "MODIFIER_" + key.toUpperCase()) {
            return lookupWithModifierPrefix;
        }
        return key;
    }
}