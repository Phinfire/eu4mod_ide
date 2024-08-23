export interface ILocalizationProvider {
    localize(key: string, language: string): string;
}