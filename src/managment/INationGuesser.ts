export interface Guesser {
    guessNationTag(name: string): string | null;
}