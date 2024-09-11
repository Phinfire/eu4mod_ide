import { Constants } from "../../Constants";
import { ILocalisationProvider } from "./ILocalizationProvider";
import { Language } from "./Language";

export class LocalisationProvider implements ILocalisationProvider {

    private bigLocalisationMap: Map<Language, Map<string, string>> = new Map<Language, Map<string, string>>();

    public async setLocalisations(promisedLookup: Promise< Map<Language, Map<string, string>>>) {
        this.bigLocalisationMap = await promisedLookup;
    }

    public localize(key: string, language: Language): string {
        if (this.bigLocalisationMap.has(language)) {
            const languageMap = this.bigLocalisationMap.get(language)!;
            if (languageMap.has(key)) {
                return languageMap.get(key)!;
            }
            if (languageMap.has(key.toUpperCase())) {
                return languageMap.get(key.toUpperCase())!;
            }
            if (languageMap.has(key.toLowerCase())) {
                return languageMap.get(key.toLowerCase())!;
            }
        }
        return key;
    }

    public isReady(): boolean {
        return this.bigLocalisationMap.size > 0;
    }

    public getKeysThatCouldTheoreticallyBeTags(): string[] {
        const result: string[] = [];
        for (const language of Constants.getSupportedLangages()) {
            if (this.bigLocalisationMap.has(language)) {
                const languageMap = this.bigLocalisationMap.get(language)!;
                for (const key of languageMap.keys()) {
                    if (key.length == 3) {
                        result.push(key);
                    }
                }
            }
        }
        return result;
    }
}