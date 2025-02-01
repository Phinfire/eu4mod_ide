import { Emblem } from "./coa/Emblem";

export class PlacedEmblem {

    constructor(public readonly emblem: Emblem, public readonly pos: {x: number, y: number}) {

    }

}