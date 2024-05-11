import ApiException from "./ApiException";

class BadRequest extends ApiException{

    constructor(message: string) {
        super(message,400)
    }
}

export default BadRequest