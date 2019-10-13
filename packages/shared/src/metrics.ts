/**
 * Utility to record some metrics about the execution of the function
 */
export class Metrics {
    /**
     * Start time of all timers
     */
    private timers: Record<string, bigint> = {};
    /**
     * List of time recordings
     */
    private time: Record<string, bigint> = {};

    private getTime(): bigint {
        return process.hrtime.bigint();
    }

    /**
     * Start a timer at the current time
     * @param timeName
     */
    public start(timeName: string): void {
        if (this.timers[timeName] != null) {
            throw new Error(`Duplicate startTime for "${timeName}"`);
        }
        this.timers[timeName] = this.getTime();
    }

    /**
     * End the timer, returning the duration in milliseconds
     * @param timeName timer to end
     */
    public end(timeName: string): number {
        if (this.timers[timeName] == null) {
            throw new Error(`Missing startTime information for "${timeName}"`);
        }
        const duration = this.getTime() - this.timers[timeName];
        this.time[timeName] = duration;
        return Number(duration);
    }

    /**
     * Convert all the times to Number so that they can be used
     */
    public get metrics(): Record<string, number> | undefined {
        const endTimes = Object.keys(this.time);
        // No metrics were started
        if (endTimes.length === 0) {
            return undefined;
        }
        const output: Record<string, number> = {};
        for (const key of endTimes) {
            output[key] = Number(this.time[key]);
        }

        return output;
    }

    /** Get a list of timers that never finished */
    public get unfinished(): string[] | undefined {
        const startTimes = Object.keys(this.timers);
        const endTimes = Object.keys(this.time);
        // Some metrics did not finish
        if (startTimes.length === endTimes.length) {
            return undefined;
        }

        const st = new Set(startTimes);
        for (const endTime of endTimes) {
            st.delete(endTime);
        }
        return Array.from(st.keys());
    }
}
