
import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ConfigImagery } from '@basemaps/config';
import { getImageryCenterZoom, getImageryListCenterZoom, PreviewSize } from '../imagery.url.js';

describe('getImageryListCenterZoom', () => {

    const imagery1 = {
        title: 'Imagery 1',
        uri: 's3://bucket/imagery1/',
        projection: 3857,
        tileMatrix: 'WebMercatorQuad',
        bounds: { x: 0, y: 0, width: 111_000, height: 111_000 },
        files: []
    } as unknown as ConfigImagery;

    const imagery2 = {
        title: 'Imagery 2',
        uri: 's3://bucket/imagery2/',
        projection: 3857,
        tileMatrix: 'WebMercatorQuad',
        bounds: { x: 111_000, y: 111_000, width: 111_000, height: 111_000 },
        files: []
    } as unknown as ConfigImagery;


    const negativeImagery = {
        title: 'Imagery 2',
        uri: 's3://bucket/imagery2/',
        projection: 3857,
        tileMatrix: 'WebMercatorQuad',
        bounds: { x: -222_000, y: -222_000, width: 222_000, height: 222_000 },
        files: []
    } as unknown as ConfigImagery;

    it('should calculate center and zoom for a single imagery', () => {
        const result = getImageryListCenterZoom([imagery1], PreviewSize);

        assert.equal(result.lat.toFixed(2), '0.50');
        assert.equal(result.lon.toFixed(2), '0.50');

        const resultSingle = getImageryCenterZoom(imagery1, PreviewSize);

        assert.equal(resultSingle.lat.toFixed(2), '0.50');
        assert.equal(resultSingle.lon.toFixed(2), '0.50');
    });

    it('should calculate center and zoom for two imagery sets', () => {
        const result = getImageryListCenterZoom([imagery1, imagery2], PreviewSize);
        const resultSingle = getImageryListCenterZoom([imagery1], PreviewSize);
        assert.ok(result.zoom <= resultSingle.zoom);
        assert.equal(result.lat.toFixed(2), '1.00');
        assert.equal(result.lon.toFixed(2), '1.00');
    });
    it('should calculate center and zoom for three imagery sets', () => {
        const result = getImageryListCenterZoom([imagery1, imagery2, negativeImagery], PreviewSize);
        const resultSingle = getImageryCenterZoom(imagery1, PreviewSize);
        assert.ok(result.zoom <= resultSingle.zoom);
        assert.equal(result.lat.toFixed(2), '0.00');
        assert.equal(result.lon.toFixed(2), '0.00');
    });
});
