export class NationState {

    private prestige: number = 0;
    private powerProjection: number = 0;

    constructor() {
        
    }

    public getPrestige(): number {
        return this.prestige;
    }

    public getPowerProjection(): number {
        return this.powerProjection;
    }
}