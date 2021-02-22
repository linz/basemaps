import { EventEmitter } from 'events';

/**
 * Emit a "progress" event every time a "." is recorded in the output
 */
export class GdalProgressParser extends EventEmitter {
    // Progress starts with "Input file size is .., ..\n"
    waitNewLine = true;
    dotCount = 0;
    byteCount = 0;

    /** Reset the progress counter */
    reset(): void {
        this.waitNewLine = true;
        this.dotCount = 0;
        this.byteCount = 0;
    }

    get progress(): number {
        return this.dotCount * (100 / 31);
    }

    data(data: Buffer): void {
        const str = data.toString('utf8');
        this.byteCount += str.length;
        // In theory only a small amount of output bytes should be recorded
        if (this.byteCount > 1024) {
            throw new Error('Too much data: ' + str);
        }
        if (str === '0') {
            this.waitNewLine = false;
            return;
        }

        if (this.waitNewLine) {
            const newLine = str.indexOf('\n');
            if (newLine > -1) {
                this.waitNewLine = false;
                return this.data(Buffer.from(str.substr(newLine + 1)));
            }
            return;
        }

        const bytes = str.split('');
        for (const byte of bytes) {
            if (byte === '.') {
                this.dotCount++;
                this.emit('progress', this.progress);
            }
        }
    }
}
