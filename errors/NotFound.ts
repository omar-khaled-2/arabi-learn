import ApiError from "./ApiError";

class NotFound extends ApiError {
    constructor(message: string) {
        super(message, 404)
    }
}

export default NotFound