export class Skanderbeg {

    private provincesData: string | null;

    constructor(private readonly identifier: string) {
        this.provincesData = null;
    }

    public getIdentifier(): string {
        return this.identifier;
    }

    public hasProvincesData(): boolean {
        return this.provincesData !== null;
    }

    public async fetchProvincesData() {
        if (this.hasProvincesData()) {
            return Promise.resolve(this.provincesData!);
        }
        const response = await fetch("https://skanderbeg.pm/api.php?scope=getSaveDataDump&save=" + this.identifier + "&type=provincesData");
        this.provincesData = await response.text();
        return this.provincesData;
    }

    public async getAllProvinceOwnerships() {
        const result = new Map<number, string>();
        const data = await this.fetchProvincesData();
        const parsed = JSON.parse(data);
        for (let key in parsed) {
            const province = parsed[key];
            if (province && province.owner && province.owner.length == 3 && !(province.owner[0] == "C" && (province.owner[1] == "0" || province.owner[1] == "1"))) {
                result.set(parseInt(key), province.owner);
            }
        }
        return result;
    }
}