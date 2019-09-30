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
        if (Object.keys(this.time).length === 0) {
            return undefined;
        }
        return this.time;
    }
}
