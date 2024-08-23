export class Idea {

    constructor(private localizationKey: string, private modifierAssignments: Map<string,string>) {
        
    }

    getLocalizationKey() {
        return this.localizationKey;
    }

    getModifierAssignments() {
        return this.modifierAssignments;
    }
}