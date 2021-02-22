import { Aws, LogConfig, TileMetadataImageRule, TileMetadataSetRecord } from '@basemaps/shared';
import o from 'ospec';
import { TileSetUpdateAction } from '../action.tileset.update';
import { parseRgba } from '../tileset.util';

function fakeTileSet(): TileMetadataSetRecord {
    Aws.tileMetadata.Imagery.imagery.set('im_0', { name: '0', id: 'im_0' } as any);
    Aws.tileMetadata.Imagery.imagery.set('im_1', { name: '1', id: 'im_1' } as any);
    Aws.tileMetadata.Imagery.imagery.set('im_2', { name: '2', id: 'im_2' } as any);
    Aws.tileMetadata.Imagery.imagery.set('im_3', { name: '3', id: 'im_3' } as any);
    return {
        rules: [
            { ruleId: 'ir_0', imgId: 'im_0', maxZoom: 32, minZoom: 0, priority: 10 },
            { ruleId: 'ir_1', imgId: 'im_1', maxZoom: 32, minZoom: 0, priority: 10 },
            { ruleId: 'ir_2', imgId: 'im_2', maxZoom: 32, minZoom: 0, priority: 100 },
        ],
    } as any;
}

o.spec('TileSetUpdateAction', () => {
    let cmd: TileSetUpdateAction = new TileSetUpdateAction();
    let tileSet = fakeTileSet();

    function getRule(ruleId: string): TileMetadataImageRule | undefined {
        return tileSet.rules.find((f) => f.ruleId === ruleId);
    }

    function tileSetId(t: TileMetadataSetRecord): string[] {
        return t.rules.map((c) => c.imgId);
    }

    o.beforeEach(() => {
        cmd = new TileSetUpdateAction();
        cmd.minZoom = { value: undefined } as any;
        cmd.maxZoom = { value: undefined } as any;
        tileSet = fakeTileSet();
        LogConfig.disable();
    });

    o.afterEach(() => {
        Aws.tileMetadata.Imagery.imagery.clear();
    });

    o.spec('UpdateZoom', () => {
        o('should change zoom levels', async () => {
            cmd.minZoom = { value: 0 } as any;
            cmd.maxZoom = { value: 30 } as any;

            const hasChanges = await cmd.updateZoom(tileSet, 'ir_0');
            o(hasChanges).equals(true);
            o(getRule('ir_0')?.maxZoom).equals(30);
        });

        o('should not have changes when nothing changed', async () => {
            // No values to change
            const hasChangesA = await cmd.updateZoom(tileSet, 'ir_0');
            o(hasChangesA).equals(false);

            // Missing maxZoom
            cmd.minZoom = { value: 0 } as any;
            const hasChangesB = await cmd.updateZoom(tileSet, 'ir_0');
            o(hasChangesB).equals(false);

            // Valid but missing id
            cmd.maxZoom = { value: 0 } as any;
            const hasChangesC = await cmd.updateZoom(tileSet, 'ir_A');
            o(hasChangesC).equals(false);

            // No changes
            cmd.maxZoom = { value: 32 } as any;
            const hasChangesD = await cmd.updateZoom(tileSet, 'ir_0');
            o(hasChangesD).equals(false);
        });
    });

    o.spec('Replace', () => {
        o('should replace imagery', async () => {
            const hasChanges = await cmd.replaceUpdate(tileSet, 'ir_1', 'im_3');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['im_0', 'im_3', 'im_2']);
        });
    });

    o.spec('UpdatePriority', () => {
        o('should remove when priority -1', async () => {
            cmd.priority = { value: -1 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, 'ir_0');
            o(hasChanges).equals(true);
            o(tileSet.rules.length).equals(2);
            o(tileSetId(tileSet)).deepEquals(['im_1', 'im_2']);
        });

        o('should insert at priority 0', async () => {
            cmd.priority = { value: 0 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, undefined, 'im_3');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['im_3', 'im_0', 'im_1', 'im_2']);
        });

        o('should allow duplicate imagery at priority 0', async () => {
            cmd.priority = { value: 0 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, undefined, 'im_0');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['im_0', 'im_0', 'im_1', 'im_2']);
        });

        o('should insert at priority 999', async () => {
            cmd.priority = { value: 999 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, undefined, 'im_3');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['im_0', 'im_1', 'im_2', 'im_3']);
        });

        o('should insert at priority 10', async () => {
            cmd.priority = { value: 10 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, undefined, 'im_3');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['im_0', 'im_1', 'im_3', 'im_2']);
        });

        o('should reorder', async () => {
            cmd.priority = { value: 50 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, 'ir_0');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['im_1', 'im_0', 'im_2']);
        });

        o('should have no changes if not reordering', async () => {
            cmd.priority = { value: 10 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, 'ir_0');
            o(hasChanges).equals(false);
        });
    });

    o.spec('resize', () => {
        o('should create resize kernel', () => {
            cmd.resizeIn = { value: 'nearest' } as any;
            cmd.resizeOut = { value: 'lanczos3' } as any;
            const hasChanges = cmd.updateResize(tileSet);
            o(hasChanges).equals(true);
            o(tileSet.resizeKernel).deepEquals({ in: 'nearest', out: 'lanczos3' });
        });

        o('should not update if one value is missing', () => {
            cmd.resizeIn = { value: 'nearest' } as any;
            cmd.resizeOut = { value: undefined } as any;
            o(cmd.updateResize(tileSet)).equals(false);

            cmd.resizeIn = { value: undefined } as any;
            cmd.resizeOut = { value: 'nearest' } as any;
            o(cmd.updateResize(tileSet)).equals(false);

            o(tileSet.resizeKernel).equals(undefined);
        });

        o('should validate types', () => {
            cmd.resizeIn = { value: 'foo' } as any;
            cmd.resizeOut = { value: 'nearest' } as any;
            o(cmd.updateResize(tileSet)).equals(false);

            cmd.resizeIn = { value: 'nearest' } as any;
            cmd.resizeOut = { value: 'foo' } as any;
            o(cmd.updateResize(tileSet)).equals(false);
        });
    });

    o.spec('background', () => {
        o('should support 0x', () => {
            const colors = parseRgba('0xff00ff00');
            o(colors).deepEquals({ r: 255, g: 0, b: 255, alpha: 0 });
        });

        o('should support smaller hex strings', () => {
            o(parseRgba('0xffffff')).deepEquals({ r: 255, g: 255, b: 255, alpha: 0 });
            o(parseRgba('0xffffffff')).deepEquals({ r: 255, g: 255, b: 255, alpha: 255 });
        });

        o('should throw if hex string invalid', () => {
            o(() => parseRgba('0x')).throws(Error);
            o(() => parseRgba('0xff')).throws(Error);
            o(() => parseRgba('0xffff')).throws(Error);
        });

        o('should support all hex', () => {
            for (let i = 0x00; i <= 0xff; i++) {
                const hex = i.toString(16).padStart(2, '0');
                const colors = parseRgba(`${hex}${hex}${hex}${hex}`);
                o(colors).deepEquals({ r: i, g: i, b: i, alpha: i });
            }
        });

        o('should update background', async () => {
            cmd.background = { value: '0xff00ff00' } as any;
            const hasChanges = cmd.updateBackground(tileSet);
            o(hasChanges).equals(true);
            o(tileSet.background).deepEquals({ r: 255, g: 0, b: 255, alpha: 0 });
        });

        o('should only update if changes background', async () => {
            cmd.background = { value: '0xff00ff00' } as any;
            tileSet.background = { r: 255, g: 0, b: 255, alpha: 0 };
            const hasChanges = cmd.updateBackground(tileSet);
            o(hasChanges).equals(false);
            o(tileSet.background).deepEquals({ r: 255, g: 0, b: 255, alpha: 0 });
        });
    });
});
