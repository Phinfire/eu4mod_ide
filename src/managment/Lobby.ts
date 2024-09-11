export class Lobby {

    private players: {playerDiscordId: string, tag: string, dead: boolean}[] = [];

    constructor() {
        
    }

    public addPlayer(playerDiscordId: string, tag: string) {
        this.players.push({playerDiscordId: playerDiscordId, tag: tag, dead: false});
    }

    public removePlayer(playerDiscordId: string) {
        this.players = this.players.filter(p => p.playerDiscordId != playerDiscordId);
    }

    public setPlayerDead(playerDiscordId: string) {
        this.players.find(p => p.playerDiscordId == playerDiscordId)!.dead = true;
    }

    public clone() {
        const clone = new Lobby();
        clone.players = this.players.map(p => {return {...p}});
        return clone;
    }
}