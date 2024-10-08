import { Constants } from "../../Constants";
import { Game } from "../../model/Game";
import { OverrideNation } from "../../model/OverrideNation";
import { resolveAmbigousPointExpression } from "../../utils";
import { Guesser } from "../INationGuesser";
import { DiscordUser } from "./DiscordUser";
import { Entry } from "./Entry";

interface IMyDiscordMessage {
    authorName: string;
    authorId: string;
    content: string;
    timestamp: string;
}

export class Discord {

    //private rootUrl: string = "http://localhost:8081/api/";
    private rootUrl: string = "http://codingafterdark.de:8081/api/";

    private cachedDiscordUsers: Map<string, DiscordUser> = new Map<string, DiscordUser>();

    constructor() {

    }

    public async reImportFromDiscord(nationGuesser: Guesser, game: Game) { //TODO: number matches are too permissive
        const msg = await new Discord().getLastMessages();
        const perMessageResults = msg.messages.slice(0,1).map((message) => {
            const preResult : {nationAlias: string, playerId: string, points: number}[] = [];
            message.content.split("\n").map((line: string) => line.trim()).filter((line: string) => line.length > 0 && line.indexOf(".") == -1).forEach((line: string) => {
                const discordMention = line.match(/<@!?\d+>/);
                const nationName = line.match(/[A-Za-zÄÖÜäöüß]+/);
                if (discordMention && nationName) {
                    const nationAlias = nationName[0];
                    const playerId = discordMention[0].substring(2, discordMention[0].length - 1);
                    const lineWithoutNationAndName = line.replace(nationName[0], "").replace(discordMention[0], "").trim();
                    if (lineWithoutNationAndName.length == 0) {
                        preResult.push({nationAlias: nationAlias, playerId: playerId, points: 6});
                    }
                    const points = resolveAmbigousPointExpression(lineWithoutNationAndName);
                    preResult.push({nationAlias: nationAlias, playerId: playerId, points: points});
                }
            });
            preResult.sort((a, b) => a.nationAlias.localeCompare(b.nationAlias));
            const result: Entry[] = [];
            preResult.forEach((entry) => {
                const tag = nationGuesser.guessNationTag(entry.nationAlias);
                const player = Discord.isNoUser(entry.playerId) ? new Discord().getNewNoUserUser() : msg.users.get(entry.playerId);
                if (tag && player) {
                    const nation = game.getNationByTag(tag);
                    if (nation) {
                        result.push(new Entry(entry.points, nation, player));
                    } else {
                        result.push(new Entry(entry.points, OverrideNation.fabricateDummyNation(entry.nationAlias, game), player));
                    }
                } else {
                    result.push(new Entry(entry.points, OverrideNation.fabricateDummyNation(entry.nationAlias, game), new Discord().getNewNoUserUser()));
                }
            });
            this.cachedDiscordUsers = msg.users;
            console.log(result.length + "/" + preResult.length + " entries imported");
            return result;
        });
        return perMessageResults[0];
    }

    public async importUsers() {
        const users = await fetch(this.rootUrl + "users").then(response => response.json());
        const userMap = new Map<string, DiscordUser>();
        for (let key in users) {
            const userData = users[key];
            const avatarUrl = userData.avatarUrl ? userData.avatarUrl : null;
            userMap.set(key, new DiscordUser(userData.effectiveName, key, avatarUrl));
        }
        this.cachedDiscordUsers = userMap;
        return userMap;
    }

    public getLastMessages() : Promise<{messages: IMyDiscordMessage[], users: Map<string, DiscordUser>}> {
        const res = Promise.all([fetch(this.rootUrl + "messages"), fetch(this.rootUrl + "users")]).then(responses => {
            return Promise.all([responses[0].json(), responses[1].json()]);
        }).then(data => {
            const messages =  data[0].map((rawMessage: any) => {
                return {authorId: rawMessage.authorId, content: rawMessage.content, timestamp: rawMessage.creationTime};
            });
            const rawusers = data[1];
            const users = new Map<string, DiscordUser>();
            for (let key in rawusers) {
                const userData = rawusers[key];
                const avatarUrl = userData.avatarUrl ? userData.avatarUrl : null;
                users.set(key, new DiscordUser(userData.effectiveName, key, avatarUrl));
            }
            messages.sort((a: IMyDiscordMessage, b: IMyDiscordMessage) => {
                return b.timestamp.localeCompare(a.timestamp);
            });
            return {messages: messages, users: users};
        }).catch(error => {
            console.error("Failed to fetch data", error);
            return {messages: [], users: new Map<string, DiscordUser>()};
        });
        return res;
    }

    public getNewNoUserUser() : DiscordUser {
        return new DiscordUser("???", "-1", Constants.getGfx("flags/REB.webp"));
    }

    public static isNoUser(userID: string) : boolean {
        return userID === "-1";
    }

    public getCachedDiscordUsers() : Map<string, DiscordUser> {
        return this.cachedDiscordUsers;
    }
}