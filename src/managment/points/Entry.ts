import { INation } from "../../model/INation";
import { DiscordUser } from "./DiscordUser";

export interface SendableEntry {
    id: string;
    points: number;
    nation: string;
    player: string;
}

export class Entry {
    
    public static readonly DEFAULT_POINTS = 6;
    public static readonly MIN_POINTS = 1;
    public static readonly MAX_POINTS = 18;

    public div: HTMLDivElement | null = null;
    private valueChangeListeners: (() => void)[] = [];

    private objectId: string;

    constructor(private points: number, private nation: INation, private player: DiscordUser) {
        this.objectId = performance.now().toString() + Math.random().toString();
    }

    public getPoints() {
        return this.points;
    }

    public setPoints(points: number) {
        if (points != this.points && points >= Entry.MIN_POINTS && points <= Entry.MAX_POINTS) {
            this.points = points;
            this.valueChangeListeners.forEach(listener => listener());
        }
    }

    public addValueChangeListener(listener: () => void) {
        this.valueChangeListeners.push(listener);
    }

    public getNation(): INation {
        return this.nation;
    }

    public setNation(nation: INation) {
        this.nation = nation;
        this.valueChangeListeners.forEach(listener => listener());
    }

    public getPlayer() {
        return this.player;
    }
    
    public setPlayer(player: DiscordUser) {
        this.player = player;
        this.valueChangeListeners.forEach(listener => listener());
    }

    public getId() {
        return this.objectId;
    }

    public toSendable() {
        return {
            id: this.objectId,
            points: this.points,
            nation: this.nation.getTag(),
            player: this.player.getId()
        };
    }
}
