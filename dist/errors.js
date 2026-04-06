export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
export const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);
