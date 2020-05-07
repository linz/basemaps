/* eslint-disable @typescript-eslint/camelcase */
import * as o from 'ospec';
import { TileSetUpdateAction } from '../action.tileset.update';
import { TileMetadataSetRecord, LogConfig, Aws } from '@basemaps/lambda-shared';

function fakeTileSet(): TileMetadataSetRecord {
    Aws.tileMetadata.Imagery.imagery.set('im_0', { name: '0' } as any);
    Aws.tileMetadata.Imagery.imagery.set('im_1', { name: '1' } as any);
    Aws.tileMetadata.Imagery.imagery.set('im_2', { name: '2' } as any);
    Aws.tileMetadata.Imagery.imagery.set('im_3', { name: '3' } as any);
    return {
        imagery: {
            im_0: { id: 'im_0', maxZoom: 32, minZoom: 0, priority: 10 },
            im_1: { id: 'im_1', maxZoom: 32, minZoom: 0, priority: 10 },
            im_2: { id: 'im_2', maxZoom: 32, minZoom: 0, priority: 100 },
        },
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

            const hasChanges = await cmd.updateZoom(tileSet, 'im_0');
            o(hasChanges).equals(true);
            o(tileSet.imagery['im_0'].maxZoom).equals(30);
        });

        o('should not have changes when nothing changed', async () => {
            // No values to change
            const hasChangesA = await cmd.updateZoom(tileSet, 'im_0');
            o(hasChangesA).equals(false);

            // Missing maxZoom
            cmd.minZoom = { value: 0 } as any;
            const hasChangesB = await cmd.updateZoom(tileSet, 'im_0');
            o(hasChangesB).equals(false);

            // Valid but missing id
            cmd.maxZoom = { value: 0 } as any;
            const hasChangesC = await cmd.updateZoom(tileSet, 'im_A');
            o(hasChangesC).equals(false);

            // No changes
            cmd.maxZoom = { value: 32 } as any;
            const hasChangesD = await cmd.updateZoom(tileSet, 'im_0');
            o(hasChangesD).equals(false);
        });
    });

    o.spec('Replace', () => {
        o('should replace imagery', async () => {
            cmd.replaceImageryId = { value: '3' } as any;
            const hasChanges = await cmd.replaceUpdate(tileSet, 'im_1');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['im_0', 'im_3', 'im_2']);
        });

        o('should not replace imagery if already exists', async () => {
            cmd.replaceImageryId = { value: '0' } as any;
            const hasChanges = await cmd.replaceUpdate(tileSet, 'im_1');
            o(hasChanges).equals(false);
        });
    });

    o.spec('UpdatePriority', () => {
        o('should remove when priority -1', async () => {
            cmd.priority = { value: -1 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, 'im_0');
            o(hasChanges).equals(true);
            o(Object.keys(tileSet.imagery).length).equals(2);
            o(tileSetId(tileSet)).deepEquals(['im_1', 'im_2']);
        });

        o('should insert at priority 0', async () => {
            cmd.priority = { value: 0 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, 'im_3');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['im_3', 'im_0', 'im_1', 'im_2']);
        });

        o('should insert at priority 999', async () => {
            cmd.priority = { value: 999 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, 'im_3');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['im_0', 'im_1', 'im_2', 'im_3']);
        });

        o('should insert at priority 10', async () => {
            cmd.priority = { value: 10 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, 'im_3');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['im_0', 'im_1', 'im_3', 'im_2']);
        });

        o('should reorder', async () => {
            cmd.priority = { value: 50 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, 'im_0');
            o(hasChanges).equals(true);
            o(tileSetId(tileSet)).deepEquals(['im_1', 'im_0', 'im_2']);
        });

        o('should have no changes if not reordering', async () => {
            cmd.priority = { value: 10 } as any;
            const hasChanges = await cmd.updatePriority(tileSet, 'im_0');
            o(hasChanges).equals(false);
        });
    });
});
