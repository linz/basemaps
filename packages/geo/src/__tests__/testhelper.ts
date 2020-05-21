import * as o from 'ospec';
import { Bounds } from '../bounds';

export function assertNear(a: number, b: number, esp = 1e-4): void {
    if (Math.abs(b - a) < esp) o(true).equals(true);
    else o(a).equals(b);
}

export function assertBounds(b: Bounds, exp: any, esp = 1e-4): void {
    assertNear(b.x, exp.x, esp);
    assertNear(b.y, exp.y, esp);
    assertNear(b.width, exp.width, esp);
    assertNear(b.height, exp.height, esp);
}
