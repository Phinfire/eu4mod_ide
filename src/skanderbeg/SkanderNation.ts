export class SkanderNation {

    private reformations: Map<string,SkanderNation> = new Map<string,SkanderNation>();

    constructor(private tag: string, private globalData: any) {

    }

    public getColorString() {
        const rgb = this.getValue("map_color");
        return "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
    }

    public getStringValue(key: string, defaultValue: string = "") {
        return this.getValue(key) || defaultValue;
    }

    public getNumberValue(key: string, defaultValue: number = 0) {
        return this.getValue(key) || defaultValue;
    }
    
    public getValue(key: string) {
        return this.globalData[this.tag][key];
    }
}