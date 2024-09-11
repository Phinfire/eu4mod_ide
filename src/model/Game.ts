import { parseParadoxFileContent } from "../parse/parse";
import { PDXFileTreeNode } from "../parse/PdxTreeNode";
import { ColonialRegion } from "./ColonialRegion";
import { Idea } from "./Idea";
import { Nation } from "./Nation";
import { NationalIdeaSet } from "./NationalIdeaSet";

export class Game {

    private nations: Nation[] = [];
    private colonialRegions: ColonialRegion[] = [];

    private nationHistoryFileCache: Map<string,PDXFileTreeNode> = new Map<string,PDXFileTreeNode>();
    private ideaFileCache: Map<string,PDXFileTreeNode> = new Map<string,PDXFileTreeNode>();

    constructor() {
        
    }

    public loadCommon(common: any) {
        for (const fileName of Object.keys(common.ideas)) {
            const ideaString = common.ideas[fileName];
            const result: PDXFileTreeNode = parseParadoxFileContent(ideaString);
            for (const key of result.getChildren().keys()) {
                const entry = result.getChildren().get(key)!;
                if (!entry.getKeyValueLeaves().has("trigger")) {
                    console.log("??? " + key);
                }
            }
            this.ideaFileCache.set(fileName, result);
        }
        const regions = parseParadoxFileContent(common.colonial_regions["00_colonial_regions.txt"]);
        for (const key of regions.getChildren().keys()) {
            console.log(key);
            if (key.indexOf("placeholder") != -1) {
                const rgb = regions.getChildren().get(key)!.getChildren().get("color")!.getValueLeaves().map(channel => Number.parseInt(channel));
                this.colonialRegions.push(new ColonialRegion(key, {r: rgb[0], g: rgb[1], b: rgb[2]}));
            }
        }
    }

    public loadHistory(history: any) {
        for (const fileName of Object.keys(history.provinces)) {
            const content = history.provinces[fileName];
            parseParadoxFileContent(content);
        }
        const countryHistoryFiles = new Map<string,PDXFileTreeNode>();
        for (const fileName of Object.keys(history.countries)) {
            countryHistoryFiles.set(fileName, parseParadoxFileContent(history.countries[fileName]));
        }
        for (const fileName of countryHistoryFiles.keys()) {
            const tag = fileName.split("-")[0].trim().toUpperCase();
            const keyValueLeaves = countryHistoryFiles.get(fileName)!.getKeyValueLeaves();
            if (keyValueLeaves.has("primary_culture")) {
                const primaryCulture = keyValueLeaves.get("primary_culture")![0];
                const ideas = this.findIdeaSetForTag(tag, primaryCulture);
                if (ideas != null) {
                    this.nations.push(new Nation(tag, ideas));
                } else {
                    //console.log("Could not find ideas for " + tag + " with primary culture " + primaryCulture);
                }
            }
        }
    }

    public loadAll(common: any, history: any) {
        this.loadCommon(common);
        this.loadHistory(history);
    }

    public getAllNations() : Nation[] {
        return this.nations;
    }

    public getAllColonialRegions() : ColonialRegion[] {
        return this.colonialRegions;
    }

    public getNationByTag(tag: string) {
        for (const nation of this.nations) {
            if (nation.getTag() == tag) {
                return nation;
            }
        }
        return null;
    }

    private findIdeaSetForTag(tag: string, primaryCulture: string) {
        for (const countryIdeaFileName of this.ideaFileCache.keys()) {
            const entries = this.ideaFileCache.get(countryIdeaFileName)!.getChildren();
            for (const entryKey of entries.keys()) {
                if (entries.get(entryKey)!.getChildren().has("trigger")) {
                    const trigger = entries.get(entryKey)!.getChildren().get("trigger")!;
                    if (Game.isSatisfied(trigger, tag, primaryCulture)) {
                        return Game.buildIdeaSetFromNode(entries.get(entryKey)!);
                    }
                }
            }
        }
        return null;
    }

    private static isSatisfied(node: PDXFileTreeNode, tag: string, primaryCulture: string) {
        const children = node.getChildren();
        const keyValues = node.getKeyValueLeaves();
        if (keyValues.has("tag") && keyValues.get("tag")!.indexOf(tag) != -1) {
            return true;
        }
        if (keyValues.has("primary_culture") && keyValues.get("primary_culture")!.indexOf(primaryCulture) != -1) {
            return true;
        }
        if (children.has("OR")) {
            if (Game.isSatisfied(children.get("OR")!, tag, primaryCulture)) {
                return true;
            }
        }
        return false;
    }

    private static buildIdeaSetFromNode(ideaSetNode: PDXFileTreeNode) {
        const ideaSetChildren = ideaSetNode.getChildren();
        const traditions = Array.from(ideaSetChildren.get("start")!.getKeyValueLeaves().keys()).map(key => {
            const value = ideaSetChildren.get("start")!.getKeyValueLeaves().get(key);
            const pseudoMap = new Map<string,string>();
            pseudoMap.set(key, value![0]); // drops duplicates in traditions (dev_cost= 0.2 and dev_cost= 0.1) -> dev_cost= 0.2, probably fine because no such traditions exist
            return new Idea(key, pseudoMap);
        });
        const ambition = ideaSetChildren.get("bonus")?.getSimplifiedKeyValueLeaves();
        const natIdeas = Array.from(ideaSetChildren.keys()).filter(key => key != "trigger" && key != "start" && key != "bonus").map(key => {
            return new Idea(key, ideaSetChildren.get(key)!.getSimplifiedKeyValueLeaves());
        });
        return new NationalIdeaSet(traditions[0], traditions[1], natIdeas, new Idea("ambition", ambition!));
    }
}