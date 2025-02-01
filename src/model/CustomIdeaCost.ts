import { ManaType } from "./ManaType";

export class CustomIdeaCost {

    constructor(private increment: number, private costPerLevel: number[], private kind: ManaType) {

    }

    getNumberOfLevels() {
        return this.costPerLevel.length;
    }

    getCost(level: number) {
        return this.costPerLevel[level];
    }

    getIncrement() {
        return this.increment;
    }

    getKind() {
        return this.kind;
    }
}