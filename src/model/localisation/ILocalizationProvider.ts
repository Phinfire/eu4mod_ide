export interface ILocalisationProvider {
    localize(key: string, language: string): string;

    isReady(): boolean;

    getKeysThatCouldTheoreticallyBeTags(): string[];
}