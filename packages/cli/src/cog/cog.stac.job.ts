import { Bounds, Epsg, Stac, StacCollection, StacLink, StacProvider } from '@basemaps/geo';
import {
    extractYearRangeFromName,
    FileConfig,
    FileConfigPath,
    FileOperator,
    ProjectionTileMatrixSet,
    titleizeImageryName,
} from '@basemaps/shared';
import { MultiPolygon, toFeatureCollection, toFeatureMultiPolygon } from '@linzjs/geojson';
import { CliInfo } from '../cli/base.cli';
import { GdalCogBuilderDefaults, GdalCogBuilderResampling } from '../gdal/gdal.config';
import { CogStac, CogStacItem, CogStacItemExtensions, CogStacKeywords } from './stac';
import {
    CogBuilderMetadata,
    CogJob,
    CogJobJson,
    CogOutputProperties,
    CogSourceProperties,
    FeatureCollectionWithCrs,
} from './types';

export const MaxConcurrencyDefault = 50;

export interface JobCreationContext {
    /** Source config */
    sourceLocation: FileConfig | FileConfigPath;

    /** Output config */
    outputLocation: FileConfig;

    /** Should the imagery be cut to a cutline */
    cutline?: {
        href: string;
        blend: number;
    };

    targetProjection: ProjectionTileMatrixSet;

    override?: {
        /** Override job id */
        id?: string;

        /**
         * Image quality
         * @default GdalCogBuilderDefaults.quality
         */
        quality?: number;

        /**
         * Number of threads to use for fetches
         * @default MaxConcurrencyDefault
         */
        concurrency?: number;

        /**
         * Override the source projection
         */
        projection?: Epsg;

        /**
         * Resampling method
         * @Default  GdalCogBuilderDefaults.resampling
         */
        resampling?: GdalCogBuilderResampling;
    };

    /**
     * Should this job be submitted to batch now?
     * @default false
     */
    batch: boolean;

    /** Should this job ignore source coverage and just produce one big COG for EPSG extent */
    oneCogCovering: boolean;
}

export interface CogJobCreateParams {
    /** unique id for imagery set */
    id: string;
    /** name of imagery set */
    imageryName: string;
    /** information about the source */
    metadata: CogBuilderMetadata;
    /** information about the output */
    ctx: JobCreationContext;
    /** the polygon to use to clip the source imagery */
    cutlinePoly: MultiPolygon;
    /** do we need an alpha band added */
    addAlpha: boolean;
}

/**
 * Information needed to create cogs
 */
export class CogStacJob implements CogJob {
    json: CogJobJson;
    private cacheTargetZoom?: {
        gsd: number;
        zoom: number;
    };

    /**
     * Load the job.json

     * @param jobpath where to load the job.json from
     */
    static async load(jobpath: string): Promise<CogStacJob> {
        return new CogStacJob(await FileOperator.readJson<CogJobJson>(jobpath));
    }

    /**
     * Create job.json, collection.json, source.geojson, covering.geojson, cutlint.geojson.gz and
     * stac descriptions of the target COGs

     */
    static async create({
        id,
        imageryName,
        metadata,
        ctx,
        cutlinePoly,
        addAlpha,
    }: CogJobCreateParams): Promise<CogStacJob> {
        let description: string | undefined;
        const providers: StacProvider[] = [];
        const links: StacLink[] = [
            {
                href: FileOperator.join(ctx.outputLocation.path, 'collection.json'),
                type: 'application/json',
                rel: 'self',
            },
            {
                href: 'job.json',
                type: 'application/json',
                rel: 'linz.basemaps.job',
            },
        ];
        let sourceStac = {} as StacCollection;

        const interval: [string, string][] = [];
        try {
            const sourceFs = FileOperator.create(ctx.sourceLocation);
            const sourceCollectionPath = FileOperator.join(ctx.sourceLocation.path, 'collection.json');
            sourceStac = await FileOperator.readJson<StacCollection>(sourceCollectionPath, sourceFs);
            description = sourceStac.description;
            interval.push(...(sourceStac.extent?.temporal?.interval ?? []));
            links.push({ href: sourceCollectionPath, rel: 'sourceImagery', type: 'application/json' });
            if (sourceStac.providers != null) {
                for (const p of sourceStac.providers) {
                    if (p.roles.indexOf('host') === -1) {
                        if (p.url === 'unknown') {
                            // LINZ LDS has put unknown in some urls
                            p.url = undefined;
                        }
                        providers.push(p);
                    }
                }
            }
        } catch (err) {
            if (!FileOperator.isCompositeError(err) || err.code !== 404) {
                throw err;
            }
        }
        const keywords = sourceStac.keywords ?? CogStacKeywords.slice();
        const license = sourceStac.license ?? Stac.License;
        const title = sourceStac.title ?? titleizeImageryName(imageryName);

        if (description == null) {
            description = 'No description';
        }

        const job = new CogStacJob({
            id,
            name: imageryName,
            title,
            description,
            source: {
                gsd: metadata.pixelScale,
                epsg: metadata.projection,
                files: metadata.bounds,
                location: ctx.sourceLocation,
            },
            output: {
                gsd: ctx.targetProjection.tms.pixelScale(metadata.resZoom),
                epsg: ctx.targetProjection.tms.projection.code,
                files: metadata.files,
                location: ctx.outputLocation,

                resampling: ctx.override?.resampling ?? GdalCogBuilderDefaults.resampling,
                quality: ctx.override?.quality ?? GdalCogBuilderDefaults.quality,
                cutline: ctx.cutline,
                addAlpha,
                nodata: metadata.nodata,
                bounds: metadata.targetBounds,
                oneCogCovering: ctx.oneCogCovering,
            },
        });

        const nowStr = new Date().toISOString();

        const sourceProj = job.sourcePtms.proj;

        const bbox = [
            sourceProj.boundsToWgs84BoundingBox(
                metadata.bounds.map((a) => Bounds.fromJson(a)).reduce((sum, a) => sum.union(a)),
            ),
        ];

        if (interval.length === 0) {
            const years = extractYearRangeFromName(imageryName);
            if (years[0] === -1) {
                throw new Error('Missing date in imagery name: ' + imageryName);
            }
            interval.push(years.map((y) => `${y}-01-01T00:00:00Z`) as [string, string]);
        }

        if (ctx.cutline) {
            links.push({ href: 'cutline.geojson.gz', type: 'application/geo+json+gzip', rel: 'linz.basemaps.cutline' });
        }

        links.push({ href: 'covering.geojson', type: 'application/geo+json', rel: 'linz.basemaps.covering' });
        links.push({ href: 'source.geojson', type: 'application/geo+json', rel: 'linz.basemaps.source' });

        const temporal = { interval };

        const jobFile = job.getJobPath(`job.json`);

        const stac: CogStac = {
            id,
            title,
            description,
            stac_version: Stac.Version,
            stac_extensions: [Stac.BaseMapsExtension],

            extent: {
                spatial: { bbox },
                temporal,
            },

            license,
            keywords,

            providers,

            summaries: {
                gsd: [metadata.pixelScale],
                'proj:epsg': [ctx.targetProjection.tms.projection.code],
                'linz:output': [
                    {
                        resampling: ctx.override?.resampling ?? GdalCogBuilderDefaults.resampling,
                        quality: ctx.override?.quality ?? GdalCogBuilderDefaults.quality,
                        cutlineBlend: ctx.cutline?.blend,
                        addAlpha,
                        nodata: metadata.nodata,
                    },
                ],
                'linz:generated': [
                    {
                        ...CliInfo,
                        datetime: nowStr,
                    },
                ],
            },

            links,
        };

        const outputFs = FileOperator.create(ctx.outputLocation);

        await FileOperator.writeJson(jobFile, job.json, outputFs);

        const covering = job.targetPtms.proj.toGeoJson(metadata.files);

        const roles = ['data'];
        const collectionLink = { href: 'collection.json', rel: 'collection' };

        for (const f of covering.features) {
            const { name } = f.properties as { name: string };
            const href = name + '.json';
            links.push({ href, type: 'application/geo+json', rel: 'item' });
            const item: CogStacItem = {
                ...f,
                id: job.id + '/' + name,
                collection: job.id,
                stac_version: Stac.Version,
                stac_extensions: CogStacItemExtensions,
                properties: {
                    ...f.properties,
                    datetime: nowStr,
                    gsd: job.output.gsd,
                    'proj:epsg': job.output.epsg,
                },
                links: [{ href: job.getJobPath(href), rel: 'self' }, collectionLink],
                assets: {
                    cog: {
                        href: name + '.tiff',
                        type: 'image/tiff; application=geotiff; profile=cloud-optimized',
                        roles,
                    },
                },
            };
            await FileOperator.writeJson(job.getJobPath(href), item, outputFs);
        }

        if (ctx.cutline != null) {
            const geoJsonCutlineOutput = job.getJobPath(`cutline.geojson.gz`);
            await FileOperator.writeJson(
                geoJsonCutlineOutput,
                this.toGeoJson(cutlinePoly, ctx.targetProjection.proj.epsg),
                outputFs,
            );
        }

        const geoJsonSourceOutput = job.getJobPath(`source.geojson`);
        await FileOperator.writeJson(geoJsonSourceOutput, job.sourcePtms.proj.toGeoJson(metadata.bounds), outputFs);

        const geoJsonCoveringOutput = job.getJobPath(`covering.geojson`);
        await FileOperator.writeJson(geoJsonCoveringOutput, covering, outputFs);

        await FileOperator.writeJson(job.getJobPath(`collection.json`), stac, outputFs);

        return job;
    }

    /**
     * build a FeatureCollection from MultiPolygon
     */
    static toGeoJson(poly: MultiPolygon, epsg: Epsg): FeatureCollectionWithCrs {
        const feature = toFeatureCollection([toFeatureMultiPolygon(poly)]) as FeatureCollectionWithCrs;
        feature.crs = {
            type: 'name',
            properties: { name: epsg.toUrn() },
        };
        return feature;
    }

    constructor(json: CogJobJson) {
        this.json = json;
    }

    get id(): string {
        return this.json.id;
    }

    get name(): string {
        return this.json.name;
    }

    get title(): string {
        return this.json.title;
    }

    get description(): string | undefined {
        return this.json.description;
    }

    get source(): CogSourceProperties {
        return this.json.source;
    }

    get output(): CogOutputProperties {
        return this.json.output;
    }

    get sourcePtms(): ProjectionTileMatrixSet {
        return ProjectionTileMatrixSet.get(this.source.epsg);
    }

    get targetZoom(): number {
        const { gsd } = this.source;
        if (this.cacheTargetZoom?.gsd !== gsd) {
            this.cacheTargetZoom = { gsd, zoom: this.targetPtms.getTiffResZoom(gsd) };
        }
        return this.cacheTargetZoom.zoom;
    }

    get targetPtms(): ProjectionTileMatrixSet {
        return ProjectionTileMatrixSet.get(this.output.epsg);
    }

    /**
     * Get a nicely formatted folder path based on the job
     *
     * @param key optional file key inside of the job folder
     */
    getJobPath(key?: string): string {
        const parts = [this.output.epsg, this.name, this.id];
        if (key != null) {
            parts.push(key);
        }
        return FileOperator.join(this.output.location.path, parts.join('/'));
    }
}
