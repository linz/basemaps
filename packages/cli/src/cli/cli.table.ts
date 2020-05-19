import * as c from 'ansi-colors';

/**
 * Simple fixed width table formatter
 */
export class CliTable<T extends Record<string, any>> {
    fields: { name: string; width: number; value: (obj: T) => string }[] = [];

    field(name: string, width: number, value: (obj: T) => string): void {
        this.fields.push({ name, width, value });
    }

    header(): void {
        console.log(this.fields.map((f) => c.bold(f.name.substr(0, f.width).padEnd(f.width))).join('\t'));
    }

    line(obj: T): string {
        return this.fields.map((f) => f.value(obj).padEnd(f.width)).join('\t');
    }

    print(obj: T[]): void {
        obj.forEach((o) => console.log(this.line(o)));
    }
}
