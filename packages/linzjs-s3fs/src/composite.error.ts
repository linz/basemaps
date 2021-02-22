export const enum ErrorCodes {
    PermissionDenied = 403,
    NotFound = 404,
    InternalError = 500,
}

/**
 * Utility error to wrap other errors to make them more understandable
 */
export class CompositeError extends Error {
    name = 'CompositeError';
    code: ErrorCodes;
    reason: Error;

    constructor(msg: string, code: ErrorCodes, reason: Error) {
        super(msg);
        this.code = code;
        this.reason = reason;
    }

    static isCompositeError(e: unknown): e is CompositeError {
        if (typeof e !== 'object' || e == null) return false;
        return (e as CompositeError).name === 'CompositeError';
    }
}
