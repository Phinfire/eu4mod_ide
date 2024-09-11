import { NationState } from "./NationState";

export class MilitaryStateBlock {


    constructor(private sourceNation: NationState) {

    }

    public getMorale(): number {
        const baseMorale = 1.0;
        const modifier = this.sourceNation.getPowerProjection()/100 + this.sourceNation.getPrestige()/100;
        return (1 + modifier) * baseMorale;
    }
}