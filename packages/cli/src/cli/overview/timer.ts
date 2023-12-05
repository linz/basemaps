export class SimpleTimer {
  /** time of last .tick() call */
  lastTime!: number;
  /** time SimpleTimer was created */
  startTime!: number;

  constructor() {
    this.reset();
  }

  /** Reset the timers */
  reset(): void {
    this.lastTime = performance.now();
    this.startTime = this.lastTime;
  }

  /** Get the duration since the last `.tick()` call rounded to 4 decimal places */
  tick(): number {
    const duration = Number((performance.now() - this.lastTime).toFixed(4));
    this.lastTime = performance.now();
    return duration;
  }

  /** Get the total time since the last `.reset()` */
  total(): number {
    return Number((performance.now() - this.startTime).toFixed(4));
  }
}
