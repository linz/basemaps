import * as projImport from 'proj4';

/**
 * Depending on how proj is imported (commonjs vs bundled) it may be imported as a "default"
 * Detect if it is wrapped with a "default" and re-export it
 *
 * TODO this is not really nice, but doesn't look like it will be fixed anytime soon
 */
let projType: any = projImport as any;
if (typeof projType.default == 'function') projType = projType.default;

export const Proj: typeof projImport = projType;
