import { FileOperator, LogType, VNodeElement, VNodeParser } from '@basemaps/shared';
import { FeatureCollection } from 'geojson';
import { basename } from 'path';
import { CogJob } from './types';
import { Cutline } from './cutline';

export const QuadKeyVrt = {
    /**
     * Build a vrt file for a tiff set with some tiffs transformed with a cutline
     *
     * @param tmpFolder temporary `cutline.geojson` will be written here
     * @param job
     * @param sourceGeo a GeoJSON object which contains the boundaries for the source images
     * @param cutline Used to filter the sources and cutline
     * @param inputVrt the source vrt to filter
     * @param quadKey to reduce vrt and cutline
     * @param logger
     *
     * @return the vrt object
     */
    async buildVrt(
        tmpFolder: string,
        job: CogJob,
        sourceGeo: FeatureCollection,
        cutline: Cutline,
        inputVrt: Buffer | string | VNodeElement,
        quadKey: string,
        logger: LogType,
    ): Promise<VNodeElement> {
        logger.info({ quadKey }, 'buildCutlineVrt');

        const vrt = inputVrt instanceof VNodeElement ? inputVrt : await VNodeParser.parse(inputVrt.toString());

        const inputTotal = job.source.files.length;

        cutline.filterSourcesForQuadKey(quadKey, job, sourceGeo);

        const useTifs = new Set<string>(job.source.files.map((n) => basename(n)));

        if (useTifs.size == 0) {
            logger.warn({ quadKey }, 'EmptySourceImagery');
        }

        if (cutline.polygons.length == 0) {
            job.output.cutline = undefined;
        } else {
            const cutlineTarget = FileOperator.join(tmpFolder, 'cutline.geojson');
            await FileOperator.create(cutlineTarget).writeJson(cutlineTarget, cutline.toGeoJson());
        }

        for (const b of vrt.tags('VRTRasterBand')) {
            const children: VNodeElement[] = [];
            for (const elm of b.elementChildren()) {
                if (elm.tag === 'SimpleSource' || elm.tag === 'ComplexSource') {
                    const sf = elm.tags('SourceFilename').next().value!;
                    const name = basename(sf.textContent);
                    if (!useTifs.has(name)) continue;
                }
                children.push(elm);
            }
            b.children = children;
        }

        logger.info(
            { inputTotal, outputTotal: job.source.files.length, cutlinePolygons: cutline.polygons.length },
            'Tiff count',
        );

        return vrt;
    },
};
