export class Emblem {

    constructor(public readonly emblemName: string, public readonly colorCount: string, public readonly category: string) {

    }

    getImageSrc(): string {
        return "https://codingafterdark.de/ck3/coa/coat_of_arms/colored_emblems/" + this.emblemName.replace(".dds", ".webp");
    }

    getImageSize(): {width: number, height: number} { //TODO: varies by emblem
        return {width: 128, height: 128};
    }
}