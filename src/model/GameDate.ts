export class GameDate {

    constructor(public readonly year: number, public readonly month: number, public readonly day: number) {
        
    }

    public isEquals(other: GameDate) {
        return this.year == other.year && this.month == other.month && this.day == other.day;
    }

    public isBefore(other: GameDate) {
        if (this.year < other.year) {
            return true;
        }
        if (this.year > other.year) {
            return false;
        }
        if (this.month < other.month) {
            return true;
        }
        if (this.month > other.month) {
            return false;
        }
        return this.day < other.day;
    }
}