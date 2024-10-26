import { PDXFileTreeNode } from "../parse/PdxTreeNode";
import { RGB } from "../util/ImageUtil";
import { GameDate } from "./GameDate";

export class Province {

    public static TERRAIN_OCEAN = "ocean";
    public static TERRAIN_INLAND_OCEAN = "inland_ocean";
    public static TERRAIN_IMPASSABLE_MOUNTAINS = "impassable_mountains";

    private owner1444: string | null = null;
    private tradeGood: string | null = null;
    private development: [number,number,number] = [0,0,0];


    constructor(private id: number, private alias: string, private historyFileContent: PDXFileTreeNode, private terrain: string | null, private colorCode: RGB) {
        this.owner1444 = this.get1444TagOrNull();
        this.tradeGood = this.getValueForLastPreStartDateKey("trade_goods");
        this.development[0] = Number.parseInt(this.getValueForLastPreStartDateKey("base_tax")!); 
        this.development[1] = Number.parseInt(this.getValueForLastPreStartDateKey("base_production")!);
        this.development[2] = Number.parseInt(this.getValueForLastPreStartDateKey("base_manpower")!);
    }

    public getColorCode() {
        return this.colorCode;
    }

    public getAlias() {
        return this.alias;
    }

    public getTradeGood() {
        return this.tradeGood;
    }

    public getDevelopment(): [number,number,number] {
        return this.development;
    }

    public getId() {
        return this.id;
    }

    public isInhabitable() {
        return this.development.reduce((a,b) => a+b);
    }

    public isWasteland() {
        return this.terrain == Province.TERRAIN_IMPASSABLE_MOUNTAINS;
    }

    public is1444Owned() {
        return this.owner1444 != null;
    }

    public get1444OwnerTag() : string {
        if (this.owner1444== null) {
            throw new Error("Province " + this.id + " has no owner in 1444");
        }
        return this.owner1444;
    }

    private get1444TagOrNull() {
        let tag  = null;
        if (this.historyFileContent.getKeyValueLeaves().has("owner")) {
            tag = this.historyFileContent.getKeyValueLeaves().get("owner")![0];
        }
        // sort keys that match year.month.day pattern, and take the last one that's before 1444.11.11
        const dateTag = this.getValueForLastPreStartDateKey("owner");
        return dateTag == null ? tag : dateTag;
    }

    private getValueForLastPreStartDateKey(key: string) {
        let val = null;
        let currentDate = new GameDate(1,1,1);
        let cutoffDate = new GameDate(1444,11,11);
        for (let key of this.historyFileContent.getChildren().keys()) {
            if (key.match(/^\d+\.\d+\.\d+$/)) {
                const date = key.split(".").map(part => Number.parseInt(part));
                const newDate = new GameDate(date[0], date[1], date[2]);
                if (this.historyFileContent.getChildren().get(key)!.getKeyValueLeaves().has("owner") && newDate.isBefore(cutoffDate) && currentDate.isBefore(newDate)) {
                    currentDate = newDate;
                    val = this.historyFileContent.getChildren().get(key)!.getKeyValueLeaves().get("owner")![0];
                }
            }
        }
        return val;
    }

}