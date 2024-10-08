import { parseParadoxFileContent } from "../parse/parse";
import { PDXFileTreeNode } from "../parse/PdxTreeNode";
import { RGB } from "../util/ImageUtil";
import { ColonialRegion } from "./ColonialRegion";
import { Idea } from "./Idea";
import { INation } from "./INation";
import { Nation } from "./Nation";
import { NationalIdeaSet } from "./NationalIdeaSet";
import { Province } from "./Province";

export class Game {

    private nations: Nation[] = [];
    private colonialRegions: ColonialRegion[] = [];

    private nationHistoryFileCache: Map<string,PDXFileTreeNode> = new Map<string,PDXFileTreeNode>();
    private ideaFileCache: Map<string,PDXFileTreeNode> = new Map<string,PDXFileTreeNode>();

    private provinceId2RGB: Map<number, RGB> = new Map<number, RGB>();

    private seaAndWastelandTiles: Map<number, string> = new Map<number, string>();

    private tag2Color: Map<string, RGB> = new Map<string, RGB>();
    private tag2Alias: Map<string, string> = new Map<string, string>();
    
    private provinces: Province[] = [];

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
            if (key.indexOf("placeholder") != -1) {
                const rgb = regions.getChildren().get(key)!.getChildren().get("color")!.getValueLeaves().map(channel => Number.parseInt(channel));
                this.colonialRegions.push(new ColonialRegion(key, {r: rgb[0], g: rgb[1], b: rgb[2]}));
            }
        }
        const countriesTagListContent = common.country_tags["00_countries.txt"];
        countriesTagListContent.split("\n").forEach((line: string) => {
            const noComment = line.split("#")[0];
            if (noComment.trim().length == 0) {
                return;
            }
            const parts = noComment.split("=");
            const left = parts[0].trim();
            const right = parts[1].trim();
            const countryFileName = right.substring(1, right.length-1).split("/")[1];
            const countryFileContent = parseParadoxFileContent(common.countries[countryFileName]);
            const rgb = countryFileContent.getChildren().get("color")!.getValueLeaves().map(channel => Number.parseInt(channel));
            this.tag2Color.set(left, new RGB(rgb[0], rgb[1], rgb[2]));
            this.tag2Alias.set(left, countryFileName.substring(0, countryFileName.length-4));
        });
            
    }

    public loadHistory(history: any) {
        for (const fileName of Object.keys(history.provinces)) {
            const content = parseParadoxFileContent(history.provinces[fileName]);
            const isSeaTileAccordingToHeuristic = content.hasNoOtherDirectOrIndirectKeyValueLeavesThan("discovered_by");
            if (fileName.indexOf("-") == -1) {
                const parts = fileName.split(" ").filter(part => part.trim().length > 0);
                const provinceId = Number.parseInt(parts[0]);
                const provinceAlias = parts[1].substring(0, parts[1].length-4);
                if (isSeaTileAccordingToHeuristic) {
                    this.seaAndWastelandTiles.set(provinceId, provinceAlias);
                } else {
                    this.provinces.push(new Province(provinceId, provinceAlias, content));
                }
            } else {
                const provinceId = Number.parseInt(fileName.split("-")[0].trim());
                const provinceAliasAndFileType = fileName.split("-")[1].trim();
                const provinceAlias = provinceAliasAndFileType.substring(0, provinceAliasAndFileType.length-4);
                if (isSeaTileAccordingToHeuristic) {
                    this.seaAndWastelandTiles.set(provinceId, provinceAlias);
                } else {
                    this.provinces.push(new Province(provinceId, provinceAlias, content));
                }
            }
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
                    this.nations.push(new Nation(tag, this.tag2Alias.get(tag)!, ideas));
                } else {
                    //console.log("Could not find ideas for " + tag + " with primary culture " + primaryCulture);
                }
            }
        }
    }

    public loadProvinceIdToRGB(provinceIdToRGB: any) {
        for (let line of provinceIdToRGB.split("\n")) {
            const parts = line.split(";");
            if (parts.length >= 3) {
                const id = Number.parseInt(parts[0]);
                const r = Number.parseInt(parts[1]);
                const g = Number.parseInt(parts[2]);
                const b = Number.parseInt(parts[3]);
                this.provinceId2RGB.set(id, new RGB(r, g, b));
            }
        }
    }

    public loadAll(common: any, history: any, definition: string) {
        this.loadCommon(common);
        this.loadHistory(history);
        this.loadProvinceIdToRGB(definition);
    }

    public getAllNations() : Nation[] {
        return this.nations;
    }

    public getAllColonialRegions() : ColonialRegion[] {
        return this.colonialRegions;
    }

    public getNationByTag(tag: string): INation | null {
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

    public getProvinces() {
        return this.provinces;
    }

    public getProvinceId2RGB() {
        return this.provinceId2RGB;
    }

    public getTag2Color(tag: string) {
        return this.tag2Color.get(tag);
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

    public provinceColorToId(color: RGB) {
        for (let [id, rgb] of this.provinceId2RGB) {
            if (rgb.r == color.r && rgb.g == color.g && rgb.b == color.b) {
                return id;
            }
        }
        throw new Error("Could not find province for color " + color.r + "," + color.g + "," + color.b);
    }

    public isLandProvinceId(id: number) {
        return !this.seaAndWastelandTiles.has(id);
    }

    public getProvinceAliasById(id: number) {
        if (this.seaAndWastelandTiles.has(id)) {
            return this.seaAndWastelandTiles.get(id);
        }
        this.getProvinceById(id).getAlias();
    }

    public getProvinceById(id: number) {
        for (let province of this.provinces) {
            if (province.getId() == id) {
                return province;
            }
        }
        throw new Error("Could not find province with id " + id);
    }

    public getTagAlias(tag: string) {
        if (this.tag2Alias.has(tag)) {
            return this.tag2Alias.get(tag);
        }
        throw new Error("Could not find alias for tag " + tag);
    }

    public get1444ProvinceColor2OwnerColor() {
        const old2New = new Map<RGB, RGB>();
        const provinces = this.getProvinces();
        const p2rgb = this.getProvinceId2RGB();
        for (let province of provinces) {
            if (province.is1444Owned()) {
                const ownerTag = province.get1444OwnerTag();
                const color = this.getTag2Color(ownerTag)!;
                old2New.set(p2rgb.get(province.getId())!, color);
            } else {
                old2New.set(p2rgb.get(province.getId())!, new RGB(128, 128, 128));
            }
        }
        const normalProvinceIds = new Set(provinces.map(province => province.getId()));
        for (let entry of Array.from(this.getProvinceId2RGB().entries()).filter(entry => !normalProvinceIds.has(entry[0]))) {
            old2New.set(entry[1], new RGB(30, 30, 30));
        }
        return old2New;
    }
}