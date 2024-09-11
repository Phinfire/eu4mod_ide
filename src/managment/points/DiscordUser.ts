import { IHasImage } from "../../model/IHasImage";
import { IHasLocalisableName } from "../../model/IHasName";

export class DiscordUser implements IHasImage, IHasLocalisableName {

    constructor(private name: string, private id: string, private avatarUrl: string) {
        this.name = name;
        this.id = id;
        this.avatarUrl = avatarUrl;
    }
    
    makeImage(): HTMLImageElement {
        const img = document.createElement("img");
        img.src = this.avatarUrl;
        return img
    }

    public getName() {
        return this.name;
    }

    public getId() {
        return this.id;
    }

    public getAvatarUrl() {
        return this.avatarUrl;
    }

    public makeAvatarImage() {
        const img = document.createElement("img");
        img.src = this.avatarUrl;
        return img;
    }
}
