import { IHasImage } from "../../model/IHasImage";
import { IHasLocalisableName } from "../../model/IHasName";

export class DiscordUser implements IHasImage, IHasLocalisableName {

    private avatarUrl: string;

    constructor(private name: string, private id: string, avatarUrl: string | null) {
        this.name = name;
        this.id = id;
        if (avatarUrl != null) {
            this.avatarUrl = avatarUrl;
        } else {
            this.avatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png";
        }
    }
    
    makeImage(): HTMLImageElement {
        const img = document.createElement("img");
        img.src = this.avatarUrl;
        img.loading = "lazy";
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
