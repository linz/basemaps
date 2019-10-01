/**
 * Utility to record some metrics about the execution of the function
 */
export class Metrics {
    /**
     * Start time of all timers
     */
    private timers: Record<string, number> = {};
    /**
     * List of time recordings
     */
    private time: Record<string, number> = {};

    /**
     * Start a timer at the current time
     * @param timeName
     */
    public start(timeName: string): void {
        if (this.timers[timeName] != null) {
            throw new Error(`Duplicate startTime for "${timeName}"`);
        }
        this.timers[timeName] = Date.now();
    }

    /**
     * End the timer, returning the duration in milliseconds
     * @param timeName timer to end
     */
    public end(timeName: string): number {
        if (this.timers[timeName] == null) {
            throw new Error(`Missing startTime information for "${timeName}"`);
        }
        const duration = Date.now() - this.timers[timeName];
        this.time[timeName] = duration;
        return duration;
    }

    public get metrics(): Record<string, number> | undefined {
        const endTimes = Object.keys(this.time);
        // No metrics were started
        if (endTimes.length === 0) {
            return undefined;
        }

        return this.time;
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
