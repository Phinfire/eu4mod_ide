import { RGB } from "../util/ImageUtil";
import { IHasImage } from "./IHasImage";

export class TradeGood implements IHasImage {

    constructor(private name: string, private basePrice: number, private color: RGB, private imageUrl: string) {
        
    }

    public getName(): string {
        return this.name;
    }

    public getColor(): RGB {
        return this.color;
    }

    public getBasePrice() {
        return this.basePrice;
    }

    makeImage(): HTMLImageElement {
        const image = document.createElement('img');
        image.src = this.imageUrl;
        image.style.width = "64px";
        image.style.height = "64px";
        return image;
    }
}