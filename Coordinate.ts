class Coordinate {
    constructor(
        public x:number,
        public y:number
    ){}

    getDistance(other:Coordinate){
        return Math.sqrt(Math.pow(this.x - other.x,2) + Math.pow(this.y - other.y,2))
    }


}



export default Coordinate