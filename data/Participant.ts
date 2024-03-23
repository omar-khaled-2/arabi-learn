class Participant{
    private _difficulty = 0
    constructor(
        public name:string,
    ){}


    get difficulty(){
        return this._difficulty
    }

    levelUp(){
        this._difficulty++;
    }

    toJSON(){
        return {
            name: this.name,
            difficulty: this.difficulty + 1
        }
    }
}

export default Participant