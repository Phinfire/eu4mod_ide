import { Language } from "./model/localisation/Language";

export class Constants {

    public static readonly API_URL = "https://codingafterdark.de/api/"

    public static readonly WEBSERVER_URL = "https://codingafterdark.de/ide/"

    public static readonly WEB_SOCKET_URL = "wss://codingafterdark.de/ws"
    
    public static getSupportedLangages(): Language[] {
        return [Language.ENGLISH, Language.GERMAN];
    }

    public static getGfx(name: string): string {
        return Constants.WEBSERVER_URL + "gfx/" + name;
    }

    public static getAppGraphics(name: string): string {
        return Constants.WEBSERVER_URL + "app/" + name;
    }

    public static getMapImage(name: string): string {
        return Constants.WEBSERVER_URL + "map/" + name;
    }
}