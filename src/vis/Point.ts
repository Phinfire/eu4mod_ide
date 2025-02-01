export class Point<C,G> {

    constructor(private x: number, private y: number, private colorKey: C, private groupKey: G) {

    }

    public getX() {
        return this.x;
    }

    public getY() {
        return this.y;
    }

    public getColorKey() {
        return this.colorKey;
    }

    public getGroupKey() {
        return this.groupKey;
    }
}