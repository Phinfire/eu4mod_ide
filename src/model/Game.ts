import { parseLocalisationFile, parseNationalIdeas } from "../parse/parse";
import { PDXFileTreeNode } from "../parse/pdxTreeNode";
import { Idea } from "./Idea";
import { ILocalizationProvider } from "./ILocalizationProvider";
import { Language } from "./Language";
import { Nation } from "./Nation";
import { NationalIdeaSet } from "./NationalIdeaSet";

export class Game implements ILocalizationProvider{

    private nations: Nation[] = [];

    private bigLocalisationMap: Map<Language, Map<string, string>> = new Map<Language, Map<string, string>>();

    constructor() {
        
    }

    async loadNationalIdeas(rawData: any) {
        const ideaString = rawData.common.ideas["00_country_ideas.txt"];
        for (let language of [Language.ENGLISH, Language.FRENCH, Language.GERMAN, Language.SPANISH]) {
            const locLookup = new Map<string, string>();
            for (let key of Object.keys(rawData.localisation).filter(key => key.includes(language))) {
                const fileLocLookup = parseLocalisationFile(rawData.localisation[key]);
                for (let key of fileLocLookup.keys()) {
                    //TODO: check if key duplicate
                    locLookup.set(key, fileLocLookup.get(key)!);
                }
            }
            this.bigLocalisationMap.set(language, locLookup);
        }
        const loc = parseLocalisationFile(rawData.localisation["countries_l_english.yml"]);
        console.log(loc);
        console.log(this.bigLocalisationMap);
        const result: PDXFileTreeNode = parseNationalIdeas(ideaString);
        const allIdeas = result.getChildren();
        for (const ideaSetName of allIdeas.keys()) {
            const ideaSetChildren = allIdeas.get(ideaSetName)!.getChildren();
            const triggerChildren = ideaSetChildren.get("trigger")!.getKeyValueLeaves();
            if (triggerChildren.has("tag")) {
                const tags = triggerChildren.get("tag")!;
                for (let tag of tags) {
                    const traditions = Array.from(ideaSetChildren.get("start")!.getKeyValueLeaves().keys()).map(key => {
                        const value = ideaSetChildren.get("start")!.getKeyValueLeaves().get(key);
                        const pseudoMap = new Map<string,string>();
                        pseudoMap.set(key, value![0]); // TODO: is this an issue?
                        return new Idea(key, pseudoMap);
                    });
                    const ambition = ideaSetChildren.get("bonus")?.getSimplifiedKeyValueLeaves();
                    const natIdeas = Array.from(ideaSetChildren.keys()).filter(key => key != "trigger" && key != "start" && key != "bonus").map(key => {
                        return new Idea(key, ideaSetChildren.get(key)!.getSimplifiedKeyValueLeaves());
                    });
                    this.nations.push(new Nation(tag, new NationalIdeaSet(traditions[0], traditions[1], natIdeas, new Idea("ambition", ambition!)), this));
                }
            }
            if (triggerChildren.has("OR")) {

            }
        }
    }

    localize(key: string, language: Language) : string {
        if (this.bigLocalisationMap.has(language)) {
            const languageMap = this.bigLocalisationMap.get(language)!;
            if (languageMap.has(key)) {
                return languageMap.get(key)!;
            }
        }
        return key;
    }

    public getAllNations() : Nation[] {
        return this.nations;
    }
}