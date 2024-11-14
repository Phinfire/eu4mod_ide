export class Login {

    constructor(public readonly name: string, public readonly password: string | null) {
        
    }

    static fromJson(json: any): Login {
        return new Login(json.name, json.password);
    }

    public toJson(): any {
        return {name: this.name, password: this.password};
    }
}