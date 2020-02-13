import { Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
/**
 * Most tiles will be created by either a 256x256 tile or 512x512 tile
 *
 * This class is to cache the creation of the tilers, while also providing access
 * so that they can be mocked during tests.
 */
export const Tilers = {
    /** 256x256 Tiler */
    tile256: new Tiler(256),
    compose256: new TileMakerSharp(256),
    /** 512x512 Tiler */
    tile512: new Tiler(512),
};
