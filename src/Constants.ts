import { Language } from "./model/localisation/Language";

export class Constants {

    public static getSupportedLangages(): Language[] {
        return [Language.ENGLISH, Language.GERMAN];
    }

    public static getGfx(name: string): string {
        return "http://codingafterdark.de/ide/gfx/" + name;
    }
}