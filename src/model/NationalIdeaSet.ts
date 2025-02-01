import { Idea } from "./Idea";

export class NationalIdeaSet {
   
    public static DUMMY = new NationalIdeaSet(new Idea("dummy", new Map()), new Idea("dummy", new Map()), Array.from({ length: 7 }, () => new Idea("dummy", new Map())), new Idea("dummy", new Map()));

    constructor(private firstTradition: Idea, private secondTradition: Idea, private ideas: Idea[], private ambition: Idea) {
        
    }

    getFirstTradition() {
        return this.firstTradition;
    }

    getSecondTradition() {
        return this.secondTradition;
    }

    getIdeas() {
        return this.ideas;
    }

    getAmbition() {
        return this.ambition;
    }
}


