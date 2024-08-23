export class PDXFileTreeNode {

    constructor(private valueLeaves: string[], private keyValueLeaves: Map<string,string[]>, private children: Map<string,PDXFileTreeNode>) {
        
    }

    getValueLeaves() {
        return this.valueLeaves;
    }

    getKeyValueLeaves() {
        return this.keyValueLeaves;
    }

    getSimplifiedKeyValueLeaves() {
        let result = new Map<string,string>();
        for (let key of this.keyValueLeaves.keys()) {
            result.set(key, this.keyValueLeaves.get(key)![0]);
        }
        return result;
    }

    getChildren() {
        return this.children;
    }
}