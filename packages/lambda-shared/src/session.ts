import * as ulid from 'ulid';
import { Metrics } from '@basemaps/metrics';

export class LambdaSession {
    public id: string;
    public correlationId: string;
    public logContext: Record<string, any> = {};
    public timer: Metrics = new Metrics();

    public constructor(correlationId?: string) {
        this.id = ulid.ulid();
        this.correlationId = correlationId ?? ulid.ulid();
        this.set('correlationId', correlationId);
    }

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
}
