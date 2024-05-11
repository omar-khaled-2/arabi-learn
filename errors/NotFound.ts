import ApiException from "./ApiException";

class NotFound extends ApiException{
    constructor(message: string) {
        super(message,404);
    }
}


export default NotFound