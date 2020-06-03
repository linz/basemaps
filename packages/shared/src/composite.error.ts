/**
 * Utility error to wrap other errors to make them more understandable
 */
export class CompositeError extends Error {
    reason: Error;
    constructor(msg: string, reason: Error) {
        super(msg);
        this.reason = reason;
    }
}
