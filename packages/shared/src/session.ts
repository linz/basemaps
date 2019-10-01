import * as ulid from 'ulid';
import { Metrics } from './metrics';

/**
 * Because Lambda is single threaded only one request can execute at a time
 * A global session object is "ok", however not ideal.
 *
 * There exists a `async_hooks` which can be used to generate a thread local context.
 *
 * TODO if we move away from lambda either stop using this or switch to `async_hooks`
 */
let currentSession: LambdaSession | null = null;

export class LambdaSession {
    public id: string = ulid.ulid();
    public correlationId: string | null = null;
    public logContext: Record<string, any> = {};
    public timer: Metrics = new Metrics();

    /**
     * Set a key to be logged out at the end of the function call
     * @param key key to log as
     * @param val value to log
     */
    public set(key: string, val: any): void {
        if (val == null) {
            delete this.logContext[key];
        } else {
            this.logContext[key] = val;
        }
    }

    public static get(): LambdaSession {
        if (currentSession == null) {
            return LambdaSession.reset();
        }
        return currentSession;
    }

    public static reset(): LambdaSession {
        currentSession = new LambdaSession();
        return currentSession;
    }
}
