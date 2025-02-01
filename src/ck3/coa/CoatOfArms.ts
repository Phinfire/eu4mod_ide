import { parseParadoxFileContent } from "../../parse/parse";
import { RGB } from "../../util/ImageUtil";
import { PlacedEmblem } from "../PlacedEmblem";

export class CoatOfArms {

    public static parseCoatOfArms(data: string): CoatOfArms {
        const parsed = parseParadoxFileContent(data);
        const emblems: PlacedEmblem[] = [];
        if (parsed.getChildren().has("colored_emblem")) {
            for (const emblem of parsed.getChildren("colored_emblem")) {
                const emblemColor1 = emblem.getString("color1");
                const emblemColor2 = emblem.getString("color2");
                const emblemColor3 = emblem.getString("color3");
                const emblemTexture = emblem.getString("texture");
                const emblemPosition = emblem.getObject("instance").getNumbers();
                emblems.push(new PlacedEmblem(emblemColor1, emblemColor2, emblemColor3, emblemTexture, emblemPosition));
            }
        }
    }

    constructor(public readonly color1: RGB, public readonly color2: RGB, public readonly color3: RGB | null, public readonly emblems: PlacedEmblem[]) {

    }
}