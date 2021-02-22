/**
 * Utility to record some metrics about the execution of the function
 */
export class Metrics {
    /**
     * Start time of all timers
     */
    private timers: Map<string, { start: number; duration?: number }> = new Map();

    constructor() {
        if (typeof process !== 'undefined' && typeof process.hrtime.bigint === 'function') {
            const NanoSecondsToMs = BigInt(1000000);
            this.getTime = (): number => Number(process.hrtime.bigint() / NanoSecondsToMs);
        } else if (typeof typeof performance !== 'undefined') {
            this.getTime = (): number => performance.now();
        } else {
            this.getTime = (): number => Date.now();
        }
    }

    private getTime: () => number;

    /**
     * Start a timer at the current time
     * @param timeName name of timer to start
     */
    public start(timeName: string): void {
        if (this.timers.has(timeName)) {
            throw new Error(`Duplicate startTime for "${timeName}"`);
        }
        this.timers.set(timeName, { start: this.getTime() });
    }

    /**
     * End the timer, returning the duration in milliseconds
     * @param timeName timer to end
     */
    public end(timeName: string): number {
        const timer = this.timers.get(timeName);
        if (timer == null) {
            throw new Error(`Missing startTime information for "${timeName}"`);
        }
        const duration = this.getTime() - timer.start;
        timer.duration = duration;
        return duration;
    }

    /** Get list of all timers that have run */
    public get metrics(): Record<string, number> | undefined {
        if (this.timers.size === 0) return undefined;
        const output: Record<string, number> = {};
        for (const [key, timer] of this.timers.entries()) {
            if (timer.duration != null) output[key] = timer.duration;
        }
        return output;
    }

    /** Get a list of timers that never finished */
    public get unfinished(): string[] | undefined {
        const st: string[] = [];
        for (const [key, timer] of this.timers.entries()) {
            if (timer.duration == null) st.push(key);
        }
        if (st.length === 0) return undefined;
        return st;
    }
}
