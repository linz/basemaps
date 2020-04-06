import * as c from 'chalk';

/**
 * Simple fixed width table formatter
 */
export class CliTable<T extends Record<string, any>> {
    fields: { name: string; width: number; value: (obj: T, index: number) => string }[] = [];

    field(name: string, width: number, value: (obj: T, index: number) => string): void {
        this.fields.push({ name, width, value });
    }

    header(): void {
        console.log(this.fields.map((f) => c.bold(f.name.substr(0, f.width).padEnd(f.width))).join('\t'));
    }

    print(obj: T[]): void {
        obj.forEach((o, i) => {
            console.log(this.fields.map((f) => f.value(o, i).padEnd(f.width)).join('\t'));
        });
    }
}
