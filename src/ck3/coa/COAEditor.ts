import { parseParadoxFileContent } from "../../parse/parse";
import { ITabApp } from "../../ui/ITabApp";
import { PlacedEmblem } from "../PlacedEmblem";
import { Emblem } from "./Emblem";


const TEST_STRING = `
coa_rd_dynasty_1408454199={
    pattern="pattern_solid.dds"
    color1=green
    color2=white
    color3=black
    colored_emblem={
        color1=yellow_light
        color2=black
        texture="ce_crown_head.dds"
        instance={
            position={ 0.470000 0.170000 }
            scale={ 0.400000 0.380000 }
            depth=1.010000
        }
    }
    colored_emblem={
        color1=black
        color2=grey
        color3=grey
        texture="ce_owl.dds"
        instance={
            position={ 0.500000 0.600000 }
            scale={ 0.730000 0.730000 }
        }
    }
}
`;

export class COAEditor implements ITabApp {

    private readonly COA_ROOT_URL = "https://codingafterdark.de/ck3/coa/coat_of_arms";

    private panel: HTMLDivElement = document.createElement("div");

    constructor() {
        const emblemsUrl = this.COA_ROOT_URL + "/colored_emblems/50_coa_designer_emblems.txt";

        const coaCanvas = document.createElement("canvas");
        coaCanvas.width = 256;
        coaCanvas.height = 256;
        this.panel.appendChild(coaCanvas);

        const emblems = fetch(emblemsUrl)
        .then(response => response.text())
        .then(text => {
            const emblemCategories = new Map<string, Emblem[]>();
            text.split("\n")
            .map(line => line.indexOf("#") != -1 ? line.substring(0, line.indexOf("#")) : line)
            .map(line => line.replaceAll("\t", " ")).filter(line => line.trim().length > 0).forEach(line => {
                const parts = line.split(" ").filter(part => part.trim().length > 0);
                const emblemName = parts[0];
                const colorCount = parts[5]; 
                if (colorCount != "0") {
                    const category = parts[8];
                    const emblem = new Emblem(emblemName, colorCount, category);
                    if (!emblemCategories.has(category)) {
                        emblemCategories.set(category, []);
                    }
                    emblemCategories.get(category)!.push(emblem);
                }
            });
            return emblemCategories;
        }).then(emblems => {
            console.log(emblems);
            const placed = new PlacedEmblem(emblems.get("animals")![0], {x: 0.5, y: 0.5});
            this.draw(coaCanvas, [placed]);
        });
    }

    public draw(canvas: HTMLCanvasElement, emblems: PlacedEmblem[]) {
        //draw the emblem image on the canvas, including transparency
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const emblemImage = new Image();
        emblemImage.src = emblems[0].emblem.getImageSrc();
        console.log(emblemImage.src);
        const e  = emblems[0];
        emblemImage.onload = () => {
            const pixelPos = {x: canvas.width * e.pos.x - e.emblem.getImageSize().width, y: canvas.width * e.pos.y - e.emblem.getImageSize().height};
            ctx.drawImage(emblemImage, pixelPos.x, pixelPos.y, canvas.width, canvas.height);
        };
    }

    getPanel(): HTMLDivElement {
        return this.panel;
    }
    
}