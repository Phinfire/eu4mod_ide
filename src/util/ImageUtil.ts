import { getCoatOfArmsPolygonClipPath } from "../utils";

export class RGB {
    
    constructor(public readonly r: number, public readonly g: number, public readonly b: number) {

    }

    public toString() {
        return "(" + this.r + "," + this.g + "," + this.b + ")";
    }
    
    public equals(other: RGB) {
        return this.r === other.r && this.g === other.g && this.b === other.b;
    }
}

export class ImageUtil {

    public static imageToCanvas(imageUrl: string, old2New: Map<RGB, RGB>, finalCallback: (c: HTMLCanvasElement) => void, scale: number = 1): HTMLCanvasElement {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        const canvas = document.createElement('canvas');
        img.onload = function () {
            const ctx = canvas.getContext('2d')!;
            canvas.width = scale * img.width;
            canvas.height = scale *img.height;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, scale * img.width, scale * img.height);
            ImageUtil.replaceColorUsingNested(canvas, old2New);
            finalCallback(canvas);
        };
        img.src = imageUrl;
        return canvas;
    }

    public static findMeanCoordinates(canvas: HTMLCanvasElement, color: RGB): [number, number] {
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            if (r === color.r && g === color.g && b === color.b) {
                const x = (i / 4) % canvas.width;
                const y = Math.floor((i / 4) / canvas.width);
                sumX += x;
                sumY += y;
                count++;
            }
        }
        return [sumX / count, sumY / count];
    }

    public static replaceColorUsingNested(canvas: HTMLCanvasElement, old2new: Map<RGB, RGB>) {
        const nested = ImageUtil.nestColorLookup(old2new);
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            if (nested.has(r) && nested.get(r)!.has(g) && nested.get(r)!.get(g)!.has(b)) {
                const newColor = nested.get(r)!.get(g)!.get(b)!;
                imageData.data[i] = newColor.r;
                imageData.data[i + 1] = newColor.g;
                imageData.data[i + 2] = newColor.b;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    private static nestColorLookup(provinceId2RGB: Map<RGB, RGB>) {
        const result = new Map<number,Map<number,Map<number,RGB>>>();
        for (let [oldColor, newColor] of provinceId2RGB) {
            if (!result.has(oldColor.r)) {
                result.set(oldColor.r, new Map<number,Map<number,RGB>>());
            }
            if (!result.get(oldColor.r)!.has(oldColor.g)) {
                result.get(oldColor.r)!.set(oldColor.g, new Map<number,RGB>());
            }
            result.get(oldColor.r)!.get(oldColor.g)!.set(oldColor.b, newColor);
        }
        return result;
    }

    public static loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
    }
    
    public static async drawImage(ctx: CanvasRenderingContext2D, url: string, x: number, y: number, imageSize: number, clipPolygon: {x: number, y: number}[], outline: boolean) {
        const imagePromise = this.loadImage(url);
        try {
            const images = await Promise.all([imagePromise]);
            images.forEach(img => {
                ctx.save();
                ctx.beginPath();
                const polyPath = clipPolygon.map(p => [x + p.x * imageSize / 100, y + p.y * imageSize / 100]);
                ctx.moveTo(polyPath[0][0], polyPath[0][1]);
                for (let i = 1; i < polyPath.length; i++) {
                    ctx.lineTo(polyPath[i][0], polyPath[i][1]);
                }
                ctx.clip();
                ctx.drawImage(img, x, y, imageSize, imageSize);
                ctx.restore();
                if (outline) {
                    ctx.lineWidth = 1;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = "black";
                    ctx.beginPath();
                    ctx.moveTo(polyPath[0][0], polyPath[0][1]);
                    for (let i = 1; i < polyPath.length; i++) {
                        ctx.lineTo(polyPath[i][0], polyPath[i][1]);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
            });
        } catch (error) {
            console.error('Error loading images:', error);
        }
    }  
    
    public triangulate(ctx: CanvasRenderingContext2D) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const getPixel = (x: number, y: number) => {
            const i = (y * ctx.canvas.width + x) * 4;
            return new RGB(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);
        }
        for (let x = 0; x < ctx.canvas.width-1; x++) {
            for (let y = 0; y < ctx.canvas.height-1; y++) {
                const lowLow = getPixel(x, y);
                const lowHigh = getPixel(x, y+1);
                const highLow = getPixel(x+1, y);
                const highHigh = getPixel(x+1, y+1);
                
            }
        }
    }
}