import ApiError from "./ApiError";

class BadRequest extends ApiError{

    constructor(message:string){
        super(message, 400)
    }
}


export default BadRequest