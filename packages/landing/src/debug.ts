import { Basemaps } from './map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import { Epsg } from '@basemaps/geo';
import * as proj from 'ol/proj.js';
import { e } from './elm';

function round(max: number): (c: number) => number {
    const decimals = 10 ** max;
    return (c: number): number => Math.floor(c * decimals) / decimals;
}
const round7 = round(7);
const round3 = round(3);

function kv(key: string, value: string | HTMLElement): { value: HTMLElement; container: HTMLElement } {
    const valueEl: HTMLElement = typeof value == 'string' ? e('div', { className: 'debug__value' }, value) : value;
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
    bm.map.updateSize();

    const debugEl = e('div', { id: 'debug', className: 'debug' });
    const imageEl = kv('ImageId', bm.config.imageId);
    debugEl.appendChild(imageEl.container);

    const projectionEl = kv('Projection', bm.config.projection.toEpsgString());
    debugEl.appendChild(projectionEl.container);

    const zoomEl = kv('Zoom', '');
    debugEl.appendChild(zoomEl.container);

    // Change the background colors
    const purpleCheck = e('input', { type: 'checkbox' }) as HTMLInputElement;
    const colorButton = kv('Purple', purpleCheck);
    purpleCheck.onclick = (): void => {
        if (purpleCheck.checked) {
            document.body.style.backgroundColor = 'magenta';
        } else {
            document.body.style.backgroundColor = '';
        }
    };
    debugEl.appendChild(colorButton.container);
    // Add a debug OSM layer
    const osmLayer = new TileLayer({ source: new OSM({}), className: 'osm' });
    const osmRange = e('input', {
        type: 'range',
        min: 0,
        max: 1,
        value: 0,
        step: 0.05,
        className: 'osm__slider',
    }) as HTMLInputElement;
    const osmButton = kv('OSM', osmRange);
    osmRange.oninput = (): void => {
        const range = Number(osmRange.value);
        console.log('Range', { range });
        if (range == 0) {
            bm.map.removeLayer(osmLayer);
            return;
        }
        const hasLayer = bm.map
            .getLayers()
            .getArray()
            .find((f) => f == osmLayer);
        if (hasLayer == null) bm.map.addLayer(osmLayer);
        osmLayer.setOpacity(range);
    };
    debugEl.appendChild(osmButton.container);

    const mouseEl = kv(`Mouse (${bm.config.projection.toEpsgString()})`, '');
    mouseEl.container.className = 'debug__mouse';
    const mouseWgs84El = kv(`Mouse (${Epsg.Wgs84.toEpsgString()})`, '');
    mouseWgs84El.container.className = 'debug__mouse';

    debugEl.appendChild(mouseEl.container);
    debugEl.appendChild(mouseWgs84El.container);

    bm.map.getViewport().addEventListener('mousemove', (e) => {
        const px = bm.map.getEventPixel(e);
        const coord = bm.map.getCoordinateFromPixel(px);

        const wgs84 = proj
            .transform(coord, bm.config.projection.toEpsgString(), Epsg.Wgs84.toEpsgString())
            .map(round7)
            .join(', ');
        mouseWgs84El.value.innerHTML = wgs84;
        mouseEl.value.innerHTML = coord.map(round3).join(', ');
    });

    bm.map.addEventListener('postrender', () => {
        const view = bm.map.getView();
        const zoom = round3(view.getZoom());
        zoomEl.value.innerHTML = String(zoom);
    });

    document.body.appendChild(debugEl);
}
