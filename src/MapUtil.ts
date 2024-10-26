import { Constants } from "./Constants";
import { Game } from "./model/Game";
import { Province } from "./model/Province";
import { ImageUtil, RBGSet, RGB } from "./util/ImageUtil";

export class MapUtil {

    public static UNOWNED_COLOR = new RGB(128,128,128);

    public static WASTELAND_COLOR = new RGB(64,64,64);

    public static SEA_COLOR = new RGB(32,32,32);

    public static HACK_LAND = MapUtil.UNOWNED_COLOR;

    public static getUnownedColor(province: Province): RGB {
        if (province.isWasteland()) {
            return MapUtil.WASTELAND_COLOR;
        } else if (!province.isInhabitable()) {
            return MapUtil.SEA_COLOR;
        } else {
            return MapUtil.UNOWNED_COLOR;
        }
    }

    public static drawMap(color2Color: Map<RGB, RGB>, interestingColors: RGB[]): Promise<HTMLCanvasElement> {
        return new Promise((resolve, reject) => {
            const darken = (val: number) => val / (interestingColors.length > 0 ? 5 : 1);
            ImageUtil.imageToCanvas(Constants.getMapImage('provinces.png'), color2Color, (canvas) => {
                try {
                    const entriesNationColors = new RBGSet(interestingColors);
                    const sourceCtx = canvas.getContext('2d')!;
                    const aabbs = entriesNationColors.getElements().map((c => ImageUtil.getAABBOfColor(sourceCtx, c)));
                    const aabb = aabbs.reduce((a, b) => ImageUtil.mergeAABBs(a, b));
                    const padding = 30;
                    const { minX, minY, maxX, maxY } = { minX: Math.max(0, aabb.minX - padding), minY: Math.max(0, aabb.minY - padding), maxX: Math.min(canvas.width, aabb.maxX + padding), maxY: Math.min(canvas.height, aabb.maxY + padding) };
                    const croppedCanvas = document.createElement('canvas');
                    croppedCanvas.width = maxX - minX;
                    croppedCanvas.height = maxY - minY;
                    const croppedCtx = croppedCanvas.getContext('2d')!;
                    croppedCtx.drawImage(canvas, minX, minY, maxX - minX, maxY - minY, 0, 0, maxX - minX, maxY - minY);
                    const imageData = croppedCtx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        if (!entriesNationColors.has(new RGB(r, g, b))) {
                            data[i] = darken(r);
                            data[i + 1] = darken(g);
                            data[i + 2] = darken(b);
                        }
                    }
                    croppedCtx.putImageData(imageData, 0, 0);
                    resolve(croppedCanvas);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
}