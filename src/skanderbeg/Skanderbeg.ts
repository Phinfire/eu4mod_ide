import { SkanderNation } from "./SkanderNation";

export class Skanderbeg {

    private provincesData: string | null;
    
    private fetchedDumps: Map<string, string> = new Map<string, any>();

    constructor(private readonly identifier: string) {
        this.provincesData = null;
    }

    public getIdentifier(): string {
        return this.identifier;
    }

    public getUrl(): string {
        return "https://skanderbeg.pm/browse.php?id=" + this.identifier;
    }

    public hasProvincesData(): boolean {
        return this.provincesData !== null;
    }

    private async fetchData(key: string) {
        if (!this.fetchedDumps.has(key)) {
            console.log("https://skanderbeg.pm/api.php?scope=getSaveDataDump&save=" + this.identifier + "&type=" + key);
            const data = await fetch("https://skanderbeg.pm/api.php?scope=getSaveDataDump&save=" + this.identifier + "&type=" + key).then(response => response.json());
            this.fetchedDumps.set(key, data);
        }
        return this.fetchedDumps.get(key)! as any;
    }

    public async getAllProvinceOwnerships() {
        const result = new Map<number, string>();
        const data = await this.fetchData("provincesData");
        const parsed = JSON.parse(data);
        for (let key in parsed) {
            const province = parsed[key];
            if (province && province.owner && province.owner.length == 3 && !(province.owner[0] == "C" && (province.owner[1] == "0" || province.owner[1] == "1"))) {
                result.set(parseInt(key), province.owner);
            }
        }
        return result;
    }

    public async getPlayerSkanderNations() {
        const rawData = await this.fetchData("countriesData");
        const playerTags = Object.keys(rawData).filter(tag => rawData[tag].player != undefined);
        return playerTags.map(tag => new SkanderNation(tag, rawData));
    }
}