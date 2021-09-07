import { Epsg } from '@basemaps/geo';
import { e } from './elm';
import { Basemaps } from './map';

function round(max: number): (c: number) => number {
    const decimals = 10 ** max;
    return (c: number): number => Math.floor(c * decimals) / decimals;
}
const round3 = round(3);

function kv(key: string, value: string | HTMLElement): { value: HTMLElement; container: HTMLElement } {
    const valueEl: HTMLElement = typeof value === 'string' ? e('div', { className: 'debug__value' }, value) : value;
    const containerEl = e('div', { className: 'debug__info' }, [
        e('label', { className: 'debug__label' }, key),
        valueEl,
    ]);
    return { value: valueEl, container: containerEl };
}

export function addDebugLayer(bm: Basemaps): void {
    // Hide header/footer
    Array.from(document.querySelectorAll('header')).forEach((f) => (f.style.display = 'none'));
    Array.from(document.querySelectorAll('footer')).forEach((f) => (f.style.display = 'none'));
    bm.el.style.height = '100vh';
    bm.map.resize();

    const projection = bm.config.tileMatrix.projection.toEpsgString();

    const debugEl = e('div', { id: 'debug', className: 'debug' });
    const imageEl = kv('ImageId', bm.config.imageId);
    debugEl.appendChild(imageEl.container);

    const projectionEl = kv('Projection', projection);
    debugEl.appendChild(projectionEl.container);

    const tileMatrixEl = kv('TileMatrix', bm.config.tileMatrix.identifier);
    debugEl.appendChild(tileMatrixEl.container);

    const zoomEl = kv('Zoom', '');
    debugEl.appendChild(zoomEl.container);

    // Change the background colors
    const purpleCheck = e('input', { type: 'checkbox' }) as HTMLInputElement;
    const colorButton = kv('Purple', purpleCheck);
    purpleCheck.onclick = (): void => {
        if (purpleCheck.checked) document.body.style.backgroundColor = 'magenta';
        else document.body.style.backgroundColor = '';
    };
    debugEl.appendChild(colorButton.container);

    const osmRange = e('input', { type: 'range', min: 0, max: 1, value: 0, step: 0.05 }) as HTMLInputElement;
    osmRange.className = 'osm__slider';
    osmRange.oninput = (): void => {
        const hasOsm = bm.map.getSource('osm');
        if (hasOsm == null) {
            bm.map.addSource('osm', {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
            });
        }
        const range = Number(osmRange.value);
        if (range === 0) {
            bm.map.removeLayer('osm');
            return;
        }

        if (bm.map.getLayer('osm') == null) {
            bm.map.addLayer({
                id: 'osm',
                type: 'raster',
                source: 'osm',
                minzoom: 0,
                maxzoom: 24,
                paint: { 'raster-opacity': 0 },
            });
        }
        console.log('SetRange', { range });
        bm.map.setPaintProperty('osm', 'raster-opacity', range);
    };

    const osmButton = kv('OSM', osmRange);
    debugEl.appendChild(osmButton.container);

    const mouseWgs84El = kv(`Mouse (${Epsg.Wgs84.toEpsgString()})`, '');
    mouseWgs84El.container.className = 'debug__info';
    debugEl.appendChild(mouseWgs84El.container);

    bm.map.on('mousemove', (e) => {
        const loc = bm.transformLocation(e.lngLat.lat, e.lngLat.lng, bm.map.getZoom());
        mouseWgs84El.value.innerHTML = `${round3(loc.lat)}, ${round3(loc.lon)}`;
    });

    bm.map.on('render', (): boolean => {
        const zoom = round3(bm.map.getZoom() ?? 0);
        zoomEl.value.innerHTML = String(zoom);
        return true;
    });

    document.body.appendChild(debugEl);
}
