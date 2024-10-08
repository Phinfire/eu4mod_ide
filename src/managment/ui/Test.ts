import { Constants } from "../../Constants";
import { ITabApp } from "../../ui/ITabApp";
import { ImageUtil } from "../../util/ImageUtil";
import { getCoatOfArmsPolygonClipPath } from "../../utils";

export class AppTest implements ITabApp {

    private panel: HTMLDivElement;

    constructor() {
        //const titleText = "Alliance Points";
        const titleText = "Bündnispunkte";

        const url = Constants.getAppGraphics("panel.webp");

        this.panel = document.createElement("div");
        this.panel.style.width = "100%";
        this.panel.style.height = "100%";
        this.panel.style.display = "flex";
        this.panel.style.justifyContent = "center";
        this.panel.style.alignItems = "center";

        const canvas = ImageUtil.imageToCanvas(url, new Map(), (c: HTMLCanvasElement) => {
            c.style.height = "100%";
            c.style.width = "auto";
            const ctx = c.getContext('2d')!;
            ctx.font = "40px Inter";
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            ctx.shadowColor = "black";
            ctx.shadowBlur = 10;
            ctx.fillText(titleText, canvas.width / 2, canvas.height / 8.15);
            const mep = new Map<number,string[]>();
            mep.set(12, ["MSA", "FRA", "ADU", "PRU"]);
            mep.set(9, ["AZT", "TUR"]);
            mep.set(6, ["VEN", "HAB"]);
            mep.set(2, ["LXA", "SER", "MAM", "TUR"]);
        
            const perRow = 3;
            let prefixY = canvas.height / 5.5;
            // draw a a filled rectangle covering the entire canvas
            //ctx.fillStyle = "rgb(30,30,30)";
            //ctx.fillRect(0, 0, canvas.width, canvas.height);

            const imageSize = 96;
            const intraSpacing = 16;
            const interSpacing = 64;
            ctx.font = imageSize + "px Inter";
            ctx.textBaseline = "top";
            ctx.textAlign = "right";


            let imgY =  canvas.height / 5.5;
            for (let [key, tags] of mep) {
                ctx.fillText(key.toString(), 96 + imageSize, imgY);
                for (let i = 0; i < tags.length; i++) {
                    const indexInRow = i % perRow;
                    const indexInCol = Math.floor(i / perRow);
                    const url = Constants.getGfx("flags/" + tags[i] + ".webp");
                    const x = 250 + indexInRow * (imageSize + intraSpacing);    
                    const y = imgY + indexInCol * (imageSize + intraSpacing);
                    this.drawImage(ctx, url, x, y, imageSize);
                }
                imgY += Math.floor(tags.length / perRow) * (imageSize + intraSpacing) + interSpacing + imageSize;
                //this.drawFlags(ctx, 225, imgY, imageSize, tags, 0, perRow);
                //const rowsThisTime = Math.ceil(tags.length / perRow);
                //prefixY += rowsThisTime * (imageSize + 32);
            }

        }, 0.5);
        this.panel.appendChild(canvas);
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
    }
    
    private async drawImage(ctx: CanvasRenderingContext2D, url: string, x: number, y: number, imageSize: number) {
        const imagePromise = this.loadImage(url);
        try {
            const images = await Promise.all([imagePromise]);
            images.forEach(img => {
                ctx.save();
                ctx.beginPath();
                const polyPath = getCoatOfArmsPolygonClipPath().map(p => [x + p.x * imageSize / 100, y + p.y * imageSize / 100]);
                ctx.moveTo(polyPath[0][0], polyPath[0][1]);
                for (let i = 1; i < polyPath.length; i++) {
                    ctx.lineTo(polyPath[i][0], polyPath[i][1]);
                }
                ctx.clip();
                ctx.drawImage(img, x, y, imageSize, imageSize);
                ctx.restore();
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
            });
        } catch (error) {
            console.error('Error loading images:', error);
        }
    }    

    getPanel(): HTMLDivElement {
        return this.panel;
    }

}