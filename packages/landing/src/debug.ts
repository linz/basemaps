import { Basemaps } from './map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';

/**
 * VDom style document.createElement
 * @param name
 */
function e(name: string): HTMLElement;
function e(name: string, attrs: Record<string, unknown>, value?: string | HTMLElement | HTMLElement[]): HTMLElement;
function e(name: string, attrs?: Record<string, unknown>, value?: string | HTMLElement | HTMLElement[]): HTMLElement {
    const el = document.createElement(name);
    if (value == null) {
        // noop
    } else if (Array.isArray(value)) {
        value.forEach((v) => el.appendChild(v));
    } else if (typeof value == 'object') {
        el.appendChild(value);
    } else {
        el.innerHTML = value;
    }

    if (attrs) {
        Object.entries(attrs).forEach(([key, value]) => {
            (el as any)[key] = value;
        });
    }
    return el;
}

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

    bm.map.addEventListener('postrender', () => {
        const view = bm.map.getView();
        const zoom = Math.floor(view.getZoom() * 1e4) / 1e4;
        zoomEl.value.innerHTML = String(zoom);
    });

    document.body.appendChild(debugEl);
}
