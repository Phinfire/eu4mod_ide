import { PDXFileTreeNode } from "./PdxTreeNode";

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
        this.popCount++;
        return token;
    }

    public size() : number {
        return this.tokens.length;
    }

    public popExpecting(expected: TokenType) : string {
        const token = this.pop()!;
        if (!TokenStack.isExpected(token, expected)) {
            const suffix = [0,0,0,0,0,0].map(() => this.pop()).join("|");
            throw new Error(this.last + "|\"" + token + "\"|" + suffix + "\n Expected " + expected);
        }
        return token;
    }

    public popExpectingOneOf(expected: TokenType[]) : string {
        const token = this.pop()!;
        if (!expected.some(exp => TokenStack.isExpected(token, exp))) {
            const suffix = [0,0,0,0,0,0].map(() => this.pop()).join("|");
            throw new Error(this.last + "|\"" + token + "\"|" + suffix + "\n Expected one of " + expected);
        }
        return token;
    }

    public static isExpected(tokenContent: string, expected: TokenType) : boolean {
        switch (expected) {
            case TokenType.CURLY_OPEN:
                return tokenContent == "{";
            case TokenType.CURLY_CLOSE:
                return tokenContent == "}";
            case TokenType.EQUALS:
                return tokenContent == "=";
            case TokenType.WORD:
                return tokenContent.length > 0 && !tokenContent.startsWith("{") && !tokenContent.startsWith("}") && !tokenContent.startsWith("=");
            default:
                return false;
        }
    }
}

export function parseParadoxFileContent(ideaFileContent: string):  PDXFileTreeNode {
    const tokenArr: string[] = [];
    const  {data: stringReplacedIdeaFileContent, lookup: stringContentLookup} = performStringReplacement(ideaFileContent);
    stringReplacedIdeaFileContent.split("\n").forEach(line => {
        const noCommentsLine = line.split("#")[0];
        noCommentsLine.replaceAll("\t", " ").replaceAll("\r", " ").split(" ").map(part => part.trim()).filter(part => part.length > 0).forEach(part => {
            tokenArr.push(...resolveMissingSpaces(part));
        });    
    });
    return parsePdxTreeNode(new TokenStack(tokenArr.concat(["}"])), stringContentLookup);
}

function parsePdxTreeNode(tokens: TokenStack, stringContentLookup: Map<string,string>) : PDXFileTreeNode {
    const valueLeaves: string[] = [];
    const directKeyValuePairs = new Map<string,string[]>();
    const directStringKeyValuePairs = new Map<string,string[]>();
    const children = new Map<string,PDXFileTreeNode>();
    let token = tokens.popExpectingOneOf([TokenType.WORD, TokenType.CURLY_CLOSE]);
    while (token != "}") {
        TokenStack.isExpected(token, TokenType.WORD);
        const key = token;
        token = tokens.popExpectingOneOf([TokenType.CURLY_CLOSE, TokenType.WORD, TokenType.EQUALS]);
        if (TokenStack.isExpected(token, TokenType.CURLY_CLOSE)) {   
            valueLeaves.push(key);
        } else if (TokenStack.isExpected(token, TokenType.WORD)) {
            valueLeaves.push(key);
            while (TokenStack.isExpected(token, TokenType.WORD)) {
                valueLeaves.push(token);
                token = tokens.popExpectingOneOf([TokenType.WORD, TokenType.CURLY_CLOSE]);
            }
        } else {
            token = tokens.popExpectingOneOf([TokenType.WORD, TokenType.CURLY_OPEN]);
            if (TokenStack.isExpected(token, TokenType.CURLY_OPEN)) {
                children.set(key!, parsePdxTreeNode(tokens, stringContentLookup));
            } else {
                if (stringContentLookup.has(token)) {
                    if (!directStringKeyValuePairs.has(key!)) {
                        directStringKeyValuePairs.set(key!, []);
                    }
                    directStringKeyValuePairs.set(key!, directStringKeyValuePairs.get(key!)!.concat(stringContentLookup.get(token)!));
                } else {
                    if (!directKeyValuePairs.has(key!)) {
                        directKeyValuePairs.set(key!, []);
                    }
                    directKeyValuePairs.set(key!, directKeyValuePairs.get(key!)!.concat(token));
                }
            }
            token = tokens.popExpectingOneOf([TokenType.WORD, TokenType.CURLY_CLOSE]);
        }
    }
    return new PDXFileTreeNode(valueLeaves, directKeyValuePairs, directStringKeyValuePairs, children);
}

export function parseLocalisationFile(fileContent: string) : Map<string,string> {
    const result = new Map<string,string>();
    const {data: stringReplacedFileContent, lookup: stringContentLookup} = performStringReplacement(fileContent);
    stringReplacedFileContent.split("\n").map(line => line.split("#")[0].trim()).filter(line => line.length > 0 && line.indexOf(":0") != -1).forEach(line => {
        const parts = line.split(":0").map(part => part.trim());
        const key = parts[0];
        const value = parts[1];
        if (stringContentLookup.has(value)) {
            result.set(key, stringContentLookup.get(value)!);
        } else {
            result.set(key, value);
        }
    });
    return result;
}

function performStringReplacement(fileContent: string) : {data: string, lookup: Map<string,string>} {
    const stringContentLookup: Map<string,string> = new Map();
    const stringReplacedFileContent = fileContent.replace(/\".*?\"/g, (match) => {
        const key = "STRING_" + stringContentLookup.size;
        stringContentLookup.set(key, match.substring(1, match.length-1));
        return key;
    });
    return {data: stringReplacedFileContent, lookup: stringContentLookup};
}

function resolveMissingSpaces(text: string): string[] {
    if (text.length == 1) {
        return [text];
    }
    let remainingText = text;
    const tokenArr: string[] = [];
    while (remainingText.length > 0 && ["{","}", "="].some(specialSymbol => remainingText.startsWith(specialSymbol))) {
        tokenArr.push(remainingText.substring(0,1));
        remainingText = remainingText.substring(1);
    }
    const reverseSuffixTokenArray: string[] = [];
    while (remainingText.length > 0 && ["{","}", "="].some(specialSymbol => remainingText.endsWith(specialSymbol))) {
        reverseSuffixTokenArray.push(remainingText.substring(remainingText.length-1));
        remainingText = remainingText.substring(0,remainingText.length-1);
    }
    if (remainingText.length == 0) {
        return tokenArr.concat(reverseSuffixTokenArray.reverse());
    } else {
        return tokenArr.concat(splitAndReinsert(remainingText, "=")).concat(reverseSuffixTokenArray.reverse());
    }
}

function splitAndReinsert(text: string, splitter: string) {
    const parts = text.split(splitter);
    const result: string[] = [];
    for (let i = 0; i < parts.length; i++) {
        result.push(parts[i]);
        if (i < parts.length - 1) {
            result.push(splitter);
        }
    }
    return result;
}