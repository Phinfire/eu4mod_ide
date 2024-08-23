import { PDXFileTreeNode } from "./pdxTreeNode";

enum TokenType {
    CURLY_OPEN = "CURLY_OPEN",
    CURLY_CLOSE = "CURLY_CLOSE",
    EQUALS = "EQUALS",
    WORD = "WORD"
}

class TokenStack {

    private tokens: string[];

    private last: string = "";
    private popCount: number = 0;

    constructor(tokens: string[]) {
        this.tokens = tokens;
        this.tokens.reverse();
    }

    public pop() : string {
        if (this.tokens.length == 0) {
            throw new Error("No more tokens to pop");
        }
        const token = this.tokens.pop()!;
        this.last = token;
        //console.log("POP " + this.popCount + ": " + token);
        this.popCount++;
        return token;
    }

    public size() : number {
        return this.tokens.length;
    }

    public popExpecting(expected: TokenType) : string {
        const token = this.pop()!;
        if (!TokenStack.isExpected(token, expected)) {
            const suffix = [0,0,0,0].map(() => this.pop()).join("|");
            throw new Error(this.last + "|\"" + token + "\"|" + suffix + "\n Expected " + expected);
        }
        return token;
    }

    public popExpectingOneOf(expected: TokenType[]) : string {
        const token = this.pop()!;
        if (!expected.some(exp => TokenStack.isExpected(token, exp))) {
            throw new Error("Expected one of " + expected + " but got " + token);
        }
        return token;
    }

    public static isExpected(tokenContent: string, expected: TokenType) : boolean {
        if (expected == TokenType.CURLY_OPEN) {
            return tokenContent == "{";
        } else if (expected == TokenType.CURLY_CLOSE) {
            return tokenContent == "}";
        }
        if (expected == TokenType.EQUALS) {
            return tokenContent == "=";
        }
        if (expected == TokenType.WORD) {
            return tokenContent.length > 0;
        }
        return false;
    }
}

export function parseNationalIdeas(ideaFileContent: string):  PDXFileTreeNode {
    const result: Map<string,PDXFileTreeNode> = new Map();
    const tokenArr: string[] = [];
    const stringContentLookup: Map<string,string> = new Map();
    const stringReplacedIdeaFileContent = ideaFileContent.replace(/\".*?\"/g, (match) => {
        const key = "STRING_" + stringContentLookup.size;
        stringContentLookup.set(key, match.substring(1, match.length-1));
        return key;
    });
    stringReplacedIdeaFileContent.split("\n").forEach(line => {
        const noCommentsLine = line.split("#")[0];
        noCommentsLine.replaceAll("\t", " ").split(" ").map(part => part.trim()).filter(part => part.length > 0).forEach(part => {
            if (part.endsWith("{")) {
                if (part.length > 1) {
                    tokenArr.push(part.substring(0, part.length-1));
                }
                tokenArr.push("{");
            } else if (part.endsWith("=")) {
                if (part.length > 1) {
                    tokenArr.push(part.substring(0, part.length-1));
                }
                tokenArr.push("=");
            } else if (part.endsWith("}")) {
                if (part.length > 1) {
                    tokenArr.push(part.substring(0, part.length-1));
                }
                tokenArr.push("}");
            } else {
                tokenArr.push(part);
            }
        });    
    });
    return parsePdxTreeNode(new TokenStack(tokenArr.concat(["}"])), stringContentLookup);
}

function parsePdxTreeNode(tokens: TokenStack, stringContentLookup: Map<string,string>) : PDXFileTreeNode {
    const valueLeaves: string[] = [];
    const directKeyValuePairs = new Map<string,string[]>();
    const children = new Map<string,PDXFileTreeNode>();
    let token = tokens.popExpectingOneOf([TokenType.WORD, TokenType.CURLY_CLOSE]);
    while (token != "}") {
        TokenStack.isExpected(token, TokenType.WORD);
        const key = token;
        token = tokens.popExpecting(TokenType.EQUALS);
        token = tokens.popExpectingOneOf([TokenType.WORD, TokenType.CURLY_OPEN]);
        if (TokenStack.isExpected(token, TokenType.CURLY_OPEN)) {
            children.set(key!, parsePdxTreeNode(tokens, stringContentLookup));
        } else {
            if (!directKeyValuePairs.has(key!)) {
                directKeyValuePairs.set(key!, []);
            }
            if (stringContentLookup.has(token)) {
                directKeyValuePairs.set(key!, directKeyValuePairs.get(key!)!.concat(stringContentLookup.get(token)!));
            } else {
                directKeyValuePairs.set(key!, directKeyValuePairs.get(key!)!.concat(token));
            }
        }
        token = tokens.popExpectingOneOf([TokenType.WORD, TokenType.CURLY_CLOSE]);
    }
    return new PDXFileTreeNode(valueLeaves, directKeyValuePairs, children);
}

export function parseLocalisationFile(fileContent: string) : Map<string,string> {
    const result = new Map<string,string>();
    const stringContentLookup: Map<string,string> = new Map();
    const stringReplacedFileContent = fileContent.replace(/\".*?\"/g, (match) => {
        const key = "STRING_" + stringContentLookup.size;
        stringContentLookup.set(key, match.substring(1, match.length-1));
        return key;
    });
    stringReplacedFileContent.split("\n").map(line => line.split("#")[0].trim()).filter(line => line.length > 0).forEach(line => {
        if (line.indexOf(":0") == -1) {
            return;
        }
        const key = line.split(":0")[0].trim();
        const value = line.split(":0")[1].trim();
        if (stringContentLookup.has(value)) {
            result.set(key, stringContentLookup.get(value)!);
        } else {
            //throw new Error("Localization value not found: \"" + value +"\" for key " + key);
        }
    });
    return result;
}