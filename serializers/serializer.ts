abstract class Serializer<T> {
    constructor(
        protected object:T
) {}
    abstract serialize(): any
}


export default Serializer