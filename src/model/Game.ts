import { Constants } from "../Constants";
import { parseParadoxFileContent } from "../parse/parse";
import { PDXFileTreeNode } from "../parse/PdxTreeNode";
import { RGB } from "../util/ImageUtil";
import { ColonialRegion } from "./ColonialRegion";
import { CustomIdeaCost } from "./CustomIdeaCost";
import { Idea } from "./Idea";
import { INation } from "./INation";
import { Nation } from "./Nation";
import { NationalIdeaSet } from "./NationalIdeaSet";
import { Province } from "./Province";
import { TradeGood } from "./TradeGood";

export class Game {

    private nations: Nation[] = [];
    private colonialRegions: ColonialRegion[] = [];

    private nationHistoryFileCache: Map<string,PDXFileTreeNode> = new Map<string,PDXFileTreeNode>();
    private ideaFileCache: Map<string,PDXFileTreeNode> = new Map<string,PDXFileTreeNode>();

    private tag2Color: Map<string, RGB> = new Map<string, RGB>();
    private tag2Alias: Map<string, string> = new Map<string, string>();
    
    private tradeGoods: TradeGood[] = [];
    private provinces: Province[] = [];

    private ideaKey2NationDesignerCost = new Map<string, CustomIdeaCost>();

    constructor() {
        
    }

    public loadCommon(common: any) {
        for (const fileName of Object.keys(common.ideas)) {
            const ideaString = common.ideas[fileName];
            const result: PDXFileTreeNode = parseParadoxFileContent(ideaString);
            for (const key of result.getChildren().keys()) {
                const entry = result.getChildren().get(key)!;
                if (!entry.getKeyValueLeaves().has("trigger")) {
                    //console.log("??? " + key);
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
        const tradeGoodPrices = parseParadoxFileContent(common.prices["00_prices.txt"]);
        const tradegoods = parseParadoxFileContent(common.tradegoods["00_tradegoods.txt"]); 
        let i = 0;
        for (const key of tradegoods.getChildren().keys()) {
            const tradeGood = tradegoods.getChildren().get(key)!;
            const color = tradeGood.getChildren().get("color")!.getValueLeaves().map(channel => Number.parseInt(channel));
            const imageUrl = Constants.getAppGraphics("resources/resource_" + i + ".webp");
            i++;
            const price = parseFloat(tradeGoodPrices.getChildren().get(key)!.getKeyValueLeaves().get("base_price")![0]);
            this.tradeGoods.push(new TradeGood(key, price, new RGB(color[0], color[1], color[2]), imageUrl));
        }

        const customIdeaFiles = common.custom_ideas;
        for (const fileName of Object.keys(customIdeaFiles)) {
            console.log("Processing " + fileName);
            const content = parseParadoxFileContent(customIdeaFiles[fileName]);
            const rootKey = content.getChildren().keys().next().value!;
            if (rootKey === undefined) {
                continue;
            }
            const root = content.getChildren().get(rootKey)!;
            const category = root.getKeyValueLeaves().get("category")![0];
            for (const key of root.getChildren().keys()) {
                const entry = root.getChildren().get(key)!;
            
            }
        }
    }

    public loadHistory(history: any, provinceId2TerrainType: Map<number, string>, provinceId2RGB: Map<number, RGB>) {
        for (const fileName of Object.keys(history.provinces)) {
            const content = parseParadoxFileContent(history.provinces[fileName]);
            if (fileName.indexOf("-") == -1) {
                const parts = fileName.split(" ").filter(part => part.trim().length > 0);
                const provinceId = Number.parseInt(parts[0]);
                const provinceAlias = parts[1].substring(0, parts[1].length-4);
                this.pushProvince(provinceId, provinceAlias, content, provinceId2TerrainType, provinceId2RGB);
            } else {
                const provinceId = Number.parseInt(fileName.split("-")[0].trim());
                const provinceAliasAndFileType = fileName.split("-")[1].trim();
                const provinceAlias = provinceAliasAndFileType.substring(0, provinceAliasAndFileType.length-4);
                this.pushProvince(provinceId, provinceAlias, content, provinceId2TerrainType, provinceId2RGB);
            }
        }
        this.loadCountriesHistory(history.countries);
    }

    private pushProvince(provinceId: number, provinceAlias: string, content: PDXFileTreeNode, provinceId2TerrainType: Map<number, string>, provinceId2RGB: Map<number, RGB>) {
        const terrain = provinceId2TerrainType.has(provinceId) ? provinceId2TerrainType.get(provinceId)! : null;
        this.provinces.push(new Province(provinceId, provinceAlias, content, terrain, provinceId2RGB.get(provinceId)!));
    }

    public loadCountriesHistory(countriesHistory: any) {
        const countryHistoryFiles = new Map<string,PDXFileTreeNode>();
        for (const fileName of Object.keys(countriesHistory)) {
            countryHistoryFiles.set(fileName, parseParadoxFileContent(countriesHistory[fileName]));
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
                    this.nations.push(new Nation(tag, this.tag2Alias.get(tag)!, NationalIdeaSet.DUMMY));
                    //console.log("Could not find ideas for " + tag + " with primary culture " + primaryCulture);
                }
            }
        }
    }

    public loadProvinceIdToRGB(provinceIdToRGB: any) {
        const provinceId2RGB = new Map<number, RGB>();
        for (let line of provinceIdToRGB.split("\n")) {
            const parts = line.split(";");
            if (parts.length >= 3) {
                const id = Number.parseInt(parts[0]);
                const r = Number.parseInt(parts[1]);
                const g = Number.parseInt(parts[2]);
                const b = Number.parseInt(parts[3]);
                provinceId2RGB.set(id, new RGB(r, g, b));
            }
        }
        return provinceId2RGB;
    }

    public loadTerrainAssignments(terrainFileContent: string, climateFileContent: string) {
        const categories = parseParadoxFileContent(terrainFileContent).getChildren().get("categories")!;
        const provinceId2TerrainType = new Map<number, string>();
        for (let type of categories.getChildren().keys()) {
            if (type == "pti") {
                continue;
            }
            const typeNode = categories.getChildren().get(type)!;
            if (typeNode.getChildren().has("terrain_override")) {
                //console.log("Processing " + type + " " + typeNode.getChildren().get("terrain_override")!.getValueLeaves().length);
                typeNode.getChildren().get("terrain_override")!.getValueLeaves().forEach((id: string) => {
                    provinceId2TerrainType.set(Number.parseInt(id), type);
                });
            }
        }
        const climate = parseParadoxFileContent(climateFileContent);
        climate.getChildren().get("impassable")!.getValueLeaves().forEach((id: string) => {
            provinceId2TerrainType.set(Number.parseInt(id), Province.TERRAIN_IMPASSABLE_MOUNTAINS);
        });
        return provinceId2TerrainType;
    }

    public loadAll(common: any, history: any, definition: string, terrain: string, climate: string) {
        this.loadCommon(common);
        this.loadHistory(history, this.loadTerrainAssignments(terrain, climate), this.loadProvinceIdToRGB(definition));
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

    public getTag2Color(tag: string) {
        if (!this.tag2Color.has(tag)) {
            throw new Error("Could not find color for tag " + tag);
        }
        return this.tag2Color.get(tag)!;
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
            pseudoMap.set(key, value![0]); // drops duplicates in traditions (dev_cost= 0.2 and dev_cost= 0.1) -> dev_cost= 0.2, probably fine since no such traditions exist or are likely to be modded in
            return new Idea(key, pseudoMap);
        });
        const ambition = ideaSetChildren.get("bonus")?.getSimplifiedKeyValueLeaves();
        const natIdeas = Array.from(ideaSetChildren.keys()).filter(key => key != "trigger" && key != "start" && key != "bonus").map(key => {
            return new Idea(key, ideaSetChildren.get(key)!.getSimplifiedKeyValueLeaves());
        });
        return new NationalIdeaSet(traditions[0], traditions[1], natIdeas, new Idea("ambition", ambition!));
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

    public get1444ProvinceColor2OwnerColor(fallback: ((p: Province) => RGB)) {
        const provinceColor2OwnerColor = new Map<RGB, RGB>();
        for (let province of this.provinces) {  
            if (province.is1444Owned()) {
            const ownerTag = province.get1444OwnerTag();
            const color = this.getTag2Color(ownerTag)!;
                provinceColor2OwnerColor.set(province.getColorCode(), color);
            } else {
                provinceColor2OwnerColor.set(province.getColorCode(), new RGB(128, 128, 128));
            }
        }
        return provinceColor2OwnerColor;
    }

    public getAllTradeGoods(includeGold: boolean = true, includeUnknown: boolean = true) {
        return this.tradeGoods.filter(tradeGood => (includeGold || tradeGood.getName() != "gold") && (includeUnknown || tradeGood.getName() != "unknown"));
    }
}