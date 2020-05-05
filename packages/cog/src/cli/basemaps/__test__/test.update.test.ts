import * as o from 'ospec';
import { TileSetUpdateAction } from '../action.tileset.update';
import { TileMetadataSetRecord, LogConfig, Aws } from '@basemaps/lambda-shared';

function fakeTileSet(): TileMetadataSetRecord {
    Aws.tileMetadata.Imagery.imagery.set('0', { name: '0' } as any);
    Aws.tileMetadata.Imagery.imagery.set('1', { name: '1' } as any);
    Aws.tileMetadata.Imagery.imagery.set('2', { name: '2' } as any);
    Aws.tileMetadata.Imagery.imagery.set('3', { name: '3' } as any);
    return {
        imagery: [
            { id: '0', maxZoom: 32, minZoom: 0, priority: 10 },
            { id: '1', maxZoom: 32, minZoom: 0, priority: 10 },
            { id: '2', maxZoom: 32, minZoom: 0, priority: 100 },
        ],
    } as any;
}

o.spec('TileSetUpdateAction', () => {
    let cmd: TileSetUpdateAction = new TileSetUpdateAction();
    let tileSet = fakeTileSet();

    const TileSet = Aws.tileMetadata.TileSet;

    function tileSetId(t: TileMetadataSetRecord): string[] {
        return TileSet.rules(t).map((c) => c.id);
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

            const hasChanges = await cmd.updateZoom(tileSet, '0');
            o(hasChanges).equals(true);
            o(tileSet.imagery[0].maxZoom).equals(30);
        });

        o('should not have changes when nothing changed', async () => {
            // No values to change
            const hasChangesA = await cmd.updateZoom(tileSet, '0');
            o(hasChangesA).equals(false);

            // Missing maxZoom
            cmd.minZoom = { value: 0 } as any;
            const hasChangesB = await cmd.updateZoom(tileSet, '0');
            o(hasChangesB).equals(false);

            // Valid but missing id
            cmd.maxZoom = { value: 0 } as any;
            const hasChangesC = await cmd.updateZoom(tileSet, '-1');
            o(hasChangesC).equals(false);

            // No changes
            cmd.maxZoom = { value: 32 } as any;
            const hasChangesD = await cmd.updateZoom(tileSet, '0');
            o(hasChangesD).equals(false);
        });
    });

    o.spec('UpdatePriority', () => {
        o('should remove when priority -1', async () => {
            cmd.priority = { value: -1 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, '0');
            o(hasChanges).equals(true);
            o(Object.keys(tileSet.imagery).length).equals(2);
            o(tileSetId(tileSet)).deepEquals(['1', '2']);
        });

        o('should insert at priority 0', async () => {
            cmd.priority = { value: 0 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, '3');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['3', '0', '1', '2']);
        });

        o('should insert at priority 999', async () => {
            cmd.priority = { value: 999 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, '3');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['0', '1', '2', '3']);
        });

        o('should insert at priority 10', async () => {
            cmd.priority = { value: 10 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, '3');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['0', '1', '3', '2']);
        });

        o('should reorder', async () => {
            cmd.priority = { value: 50 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, '0');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['1', '0', '2']);
        });

        o('should have no changes if not reordering', async () => {
            cmd.priority = { value: 10 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, '0');
            o(hasChanges).equals(false);
        });
    });
});
