/**
 * Utility error to throw expecting that Logger will fatal log its contents
 */
export class LoggerFatalError extends Error {
    obj: Record<string, unknown>;
    constructor(obj: Record<string, unknown>, msg: string) {
        super(msg);
        this.obj = obj;
    }
}
