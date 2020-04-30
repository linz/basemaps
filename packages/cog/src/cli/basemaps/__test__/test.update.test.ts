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
            { id: '0', maxZoom: 32, minZoom: 0 },
            { id: '1', maxZoom: 32, minZoom: 0 },
            { id: '2', maxZoom: 32, minZoom: 0 },
        ],
    } as any;
}

o.spec('TileSetUpdateAction', () => {
    let cmd: TileSetUpdateAction = new TileSetUpdateAction();
    let tileSet = fakeTileSet();

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
            o(tileSet.imagery.length).equals(2);
            o(tileSet.imagery.map((c) => c.id)).deepEquals(['1', '2']);
        });

        o('should insert at priority 1', async () => {
            cmd.priority = { value: 1 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, '3');
            o(hasChanges).equals(true);
            o(tileSet.imagery.map((c) => c.id)).deepEquals(['3', '0', '1', '2']);
        });

        o('should insert at priority 99', async () => {
            cmd.priority = { value: 99 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, '3');
            o(hasChanges).equals(true);
            o(tileSet.imagery.map((c) => c.id)).deepEquals(['0', '1', '2', '3']);
        });

        o('should insert at priority 2', async () => {
            cmd.priority = { value: 2 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, '3');
            o(hasChanges).equals(true);
            o(tileSet.imagery.map((c) => c.id)).deepEquals(['0', '3', '1', '2']);
        });

        o('should reorder', async () => {
            cmd.priority = { value: 2 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, '0');
            o(hasChanges).equals(true);
            o(tileSet.imagery.map((c) => c.id)).deepEquals(['1', '0', '2']);
        });

        o('should have no changes if not reordering', async () => {
            cmd.priority = { value: 1 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, '0');
            o(hasChanges).equals(false);
        });
    });
});
