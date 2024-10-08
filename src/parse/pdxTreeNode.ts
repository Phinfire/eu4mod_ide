import { mapsAreEqual } from "../utils";

export class PDXFileTreeNode {

    constructor(private valueLeaves: string[], private keyValueLeaves: Map<string,string[]>, private stringKeyValueLeaves: Map<string,string[]>, private children: Map<string,PDXFileTreeNode>) {
        if (valueLeaves.length > 0 && (keyValueLeaves.size > 0 || stringKeyValueLeaves.size > 0 || children.size > 0)) {
            throw new Error("Value leaves and key leaves are mutually exclusive:\n\n> " + valueLeaves + "\n\n> " 
                + Array.from(keyValueLeaves.entries()) + "\n\n> " + Array.from(stringKeyValueLeaves) + "\n\n> " + Array.from((children)) + "\n\n---");
        }
    }

    getValueLeaves() {
        return this.valueLeaves;
    }

    getKeyValueLeaves() {
        return this.keyValueLeaves;
    }

    getStringKeyValueLeaves() {
        return this.stringKeyValueLeaves;
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

    equals(other: PDXFileTreeNode) {
        if (this.valueLeaves.length != other.valueLeaves.length) {
            return false;
        }
        if (this.keyValueLeaves.size != other.keyValueLeaves.size) {
            return false;
        }
        if (this.stringKeyValueLeaves.size != other.stringKeyValueLeaves.size) {
            return false;
        }

        for (let i = 0; i < this.valueLeaves.length; i++) {
            if (this.valueLeaves[i] != other.valueLeaves[i]) {
                return false;
            }
        }
        for (let key of this.stringKeyValueLeaves.keys()) {
            if (!other.stringKeyValueLeaves.has(key)) {
                return false;
            }
            let values = this.stringKeyValueLeaves.get(key)!;
            let otherValues = other.stringKeyValueLeaves.get(key)!;
            if (values.length != otherValues.length) {
                return false;
            }
            for (let i = 0; i < values.length; i++) {
                if (values[i] != otherValues[i]) {
                    return false;
                }
            }
        }
        mapsAreEqual(this.keyValueLeaves, other.keyValueLeaves);
        mapsAreEqual(this.children, other.children);
        return false;
    }

    toOutputLines(depth: number): string[] {
        if (this.valueLeaves.length > 0) {
            return [this.valueLeaves.join(" ")];
        }
        const result: string[] = [];
        for (let key of this.keyValueLeaves.keys()) {
            const vals = this.keyValueLeaves.get(key)!;
            for (let val of vals) {
                result.push(key + " = " + val);
            }
        }
        for (let key of this.stringKeyValueLeaves.keys()) {
            const vals = this.stringKeyValueLeaves.get(key)!;
            for (let val of vals) {
                result.push(key + " = \"" + val + "\"");
            }
        }
        for (let key of this.children.keys()) {
            result.push(key + " = {");
            result.push(...this.children.get(key)!.toOutputLines(depth + 1));
            result.push("}");
        }
        
        return result.map((line) => " ".repeat(depth * 4) + line);
    }

    public hasNoOtherDirectOrIndirectKeyValueLeavesThan(key: string) {
        if (this.keyValueLeaves.size > 1) {
            return false;
        }
        if (this.keyValueLeaves.size == 1 && !this.keyValueLeaves.has(key)) {
            return false;
        }
        for (let child of this.children.values()) {
            if (!child.hasNoOtherDirectOrIndirectKeyValueLeavesThan(key)) {
                return false;
            }
        }
        return true;
    }

}