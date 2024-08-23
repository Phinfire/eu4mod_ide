import { Idea } from "./Idea";

export class NationalIdeaSet {
   
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


