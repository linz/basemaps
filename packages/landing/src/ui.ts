import { Epsg, GoogleTms, Nztm2000QuadTms, TileMatrixSet } from '@basemaps/geo';
import { Config, GaEvent, gaEvent } from './config.js';
import { e } from './elm.js';
import { Basemaps } from './map.js';
import { MapOptions, MapOptionType, WindowUrl } from './url.js';

interface LayerInfo {
  id: string;
  name: string;
  upperLeft: number[];
  lowerRight: number[];
  projections: Epsg[];
}

export class BasemapsUi {
  projectionNztm: HTMLElement;
  projectionWm: HTMLElement;

  apiKey: HTMLElement;
  apiXyz: HTMLElement;
  apiWmts: HTMLElement;

  basemaps: Basemaps;

  menuClose: HTMLElement;
  menuOpen: HTMLElement;
  sideNav: HTMLElement;
  projection: Epsg;

  layers: Map<string, LayerInfo> = new Map();

  constructor(basemaps: Basemaps) {
    this.basemaps = basemaps;

    const versionEl = document.getElementById('basemaps-version');
    if (versionEl) versionEl.innerText = Config.Version;

    this.bindMenuButton();
    this.bindProjectionButtons();
    this.bindApiLinks();
    this.bindMenuButton();
    this.bindContactUsButton();

    this.loadWmtsLayers();
    this.setCurrentProjection(this.basemaps.config.tileMatrix);
  }

  bindMenuButton(): void {
    const menuOpen = document.getElementById('menu-open');
    const menuClose = document.getElementById('menu-close');
    const sideNav = document.getElementById('side-nav');

    if (menuOpen == null || menuClose == null || sideNav == null) {
      throw new Error('Unable to find menu button');
    }
    this.menuOpen = menuOpen;

    menuOpen.onclick = this.menuOnClick;
    menuClose.onclick = this.menuOnClick;

    this.menuClose = menuClose;
    this.sideNav = sideNav;
  }

  bindContactUsButton(): void {
    const button = document.getElementById('contact-us');
    if (button == null) {
      throw new Error('Unable to find contact-us button');
    }

    button.onclick = (): void => {
      const subject = 'Request Basemaps Developer Access';
      const body = `
Give us a few key details to sign up for Developer Access to LINZ Basemaps. We will respond with your Apps' unique API key.

Your Name:

Your Email:

Your Service/App URL:

`;
      gaEvent(GaEvent.Ui, 'contact-us:click');

      location.href = `mailto:basemaps@linz.govt.nz?subject=${encodeURI(subject)}&body=${encodeURI(body)}`;
    };
  }

  menuOnClick = (): void => {
    if (this.sideNav.classList.contains('side-nav--opened')) {
      gaEvent(GaEvent.Ui, 'menu:close');
      this.sideNav.classList.remove('side-nav--opened');
      this.sideNav.setAttribute('aria-hidden', 'true');
    } else {
      gaEvent(GaEvent.Ui, 'menu:open');
      this.sideNav.classList.add('side-nav--opened');
      this.sideNav.setAttribute('aria-hidden', 'false');
    }
  };

  bindApiLinks(): void {
    const apiXyz = document.getElementById('api-xyz');
    const apiKey = document.getElementById('api-key');
    const apiWmts = document.getElementById('api-wmts');
    if (apiXyz == null || apiWmts == null || apiKey == null) {
      throw new Error('Unable to find api inputs');
    }
    this.apiKey = apiKey;
    this.apiXyz = apiXyz;
    this.apiWmts = apiWmts;
    this.bindCopyFromInput(apiXyz);
    this.bindCopyFromInput(apiWmts);
    this.bindCopyFromInput(apiKey);
  }

  /** Attach a listener to a button to copy the nearby input element */
  bindCopyFromInput(el: HTMLElement): void {
    const inputEl = el.querySelector('input');
    if (inputEl == null) throw new Error('Cannot find input');
    const buttonEl = el.querySelector('button');
    if (buttonEl == null) throw new Error('Cannot find button');
    const buttonIconEl = buttonEl.querySelector('i');
    if (buttonIconEl == null) throw new Error('Cannot find button icon');
    buttonIconEl.textContent = 'content_copy';

    buttonEl.onclick = (): void => {
      if (buttonEl.disabled) return;
      gaEvent(GaEvent.Ui, 'copy:' + el.id.replace('api-', '') + ':' + this.projection);

      inputEl.select();
      document.execCommand('copy');

      const originalTitle = buttonEl.title;
      buttonIconEl.innerText = 'check';
      buttonEl.disabled = true;
      buttonEl.title = 'Copied';
      buttonEl.classList.add('lui-form-icon-button--copied');

      setTimeout(() => {
        buttonEl.classList.remove('lui-form-icon-button--copied');
        buttonEl.title = originalTitle;
        buttonEl.disabled = false;
        buttonIconEl.textContent = 'content_copy';
      }, 1500);
    };
  }

  bindProjectionButtons(): void {
    const projectionNztm = document.getElementById('projection-nztm');
    const projectionWm = document.getElementById('projection-wm');
    if (projectionNztm == null || projectionWm == null) {
      throw new Error('Unable to find projection buttons');
    }
    this.projectionNztm = projectionNztm;
    this.projectionNztm.onclick = this.projectionOnClick;

    this.projectionWm = projectionWm;
    this.projectionWm.onclick = this.projectionOnClick;
  }

  projectionOnClick = (e: MouseEvent): void => {
    const target = e.target as HTMLInputElement;
    if (target.classList == null) return;
    if (target.classList.contains('lui-button-active')) return;
    if (target === this.projectionNztm) {
      this.setCurrentProjection(Nztm2000QuadTms);
    } else {
      this.setCurrentProjection(GoogleTms);
    }
  };

  setCurrentProjection(tileMatrix: TileMatrixSet): void {
    gaEvent(GaEvent.Ui, 'projection:' + tileMatrix.projection.code);
    this.projection = tileMatrix.projection;

    if (tileMatrix.identifier === 'NZTM2000Quad') {
      this.projectionNztm.classList.add('lui-button-active');
      this.projectionWm.classList.remove('lui-button-active');
      this.apiXyz.classList.add('display-none');
    } else {
      this.projectionWm.classList.add('lui-button-active');
      this.projectionNztm.classList.remove('lui-button-active');
      this.apiXyz.classList.remove('display-none');
    }
    const cfg: MapOptions = { ...this.basemaps.config, tileMatrix };

    this.updateLinks(cfg);
    this.apiKey.querySelector('input')!.value = Config.ApiKey;
  }

  updateLinks(cfg: MapOptions): void {
    this.apiXyz.querySelector('input')!.value = WindowUrl.toTileUrl(cfg, MapOptionType.TileRaster);
    this.apiWmts.querySelector('input')!.value = WindowUrl.toTileUrl(cfg, MapOptionType.Wmts);
  }

  buildLayerSwitcher(): void {
    const config = this.basemaps.config;
    const layerSwitcherSelect = document.getElementById('api-layer__input') as HTMLSelectElement;
    if (layerSwitcherSelect == null) return;
    // Destroy the existing selection
    layerSwitcherSelect.innerHTML = '';
    layerSwitcherSelect.addEventListener('change', (): void => {
      const val = layerSwitcherSelect.value;
      // Only work in 3857 for now...
      this.basemaps.config.tileMatrix = GoogleTms;
      // Handle vector layers
      if (val === 'topolike' || val === 'basic') {
        this.basemaps.config.style = val;
        this.basemaps.config.imageId = 'topographic';
        this.basemaps.updateConfigUrl();
        return;
      }

      this.basemaps.config.style = 'topolike';

      // Handle other layers
      if (this.basemaps.config.imageId === layerSwitcherSelect.value) return;
      this.basemaps.config.imageId = layerSwitcherSelect.value;
      this.basemaps.updateConfigUrl();

      const layer = this.layers.get(layerSwitcherSelect.value);
      if (layer == null) return;

      this.basemaps.map.fitBounds([layer.upperLeft, layer.lowerRight] as any);
      this.updateLinks(this.basemaps.config);
    });

    const aerialBasemaps = e('optgroup', { label: 'Raster Basemaps' }, [
      e('option', { value: 'aerial' }, 'Aerial Imagery'),
    ]);
    layerSwitcherSelect.appendChild(aerialBasemaps);

    const vectorBasemaps = e('optgroup', { label: 'Vector Basemaps' }, [
      e('option', { value: 'topolike' }, 'Topolike'),
      e('option', { value: 'basic' }, 'Basic'),
    ]);
    layerSwitcherSelect.appendChild(vectorBasemaps);

    const childLayers: HTMLElement[] = [];
    for (const [id, el] of this.layers.entries()) {
      // Since we do not change the projection yet limit to 3857
      if (!el.projections.includes(Epsg.Google)) continue;
      childLayers.push(e('option', { value: id }, el.name));
    }
    const aerialLayers = e('optgroup', { label: 'Aerial Imagery' }, childLayers);
    if (childLayers.length > 0) layerSwitcherSelect.appendChild(aerialLayers);

    if (config.imageId === 'topographic') {
      layerSwitcherSelect.value = config.style;
    } else {
      layerSwitcherSelect.value = config.imageId;
    }
  }

  /** Parse the WMTS response to grab all the layer ids and names */
  async loadWmtsLayers(): Promise<void> {
    const res = await fetch(WindowUrl.toBaseWmts());
    if (!res.ok) return;

    const dom = new DOMParser();
    const xmlDoc = dom.parseFromString(await res.text(), 'text/xml');

    const layers = xmlDoc.getElementsByTagName('Layer') as HTMLCollection;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers.item(i);
      if (layer == null) continue;

      const title = layer.getElementsByTagName('ows:Title').item(0)?.textContent;
      const id = layer.getElementsByTagName('ows:Identifier').item(0)?.textContent;
      if (title == null || id == null) continue;
      if (title === 'aerial') continue;

      const boundEl = layer.getElementsByTagName('ows:WGS84BoundingBox').item(0);
      const upperLeft = boundEl?.getElementsByTagName('ows:UpperCorner').item(0)?.textContent?.split(' ').map(Number);
      const lowerRight = boundEl?.getElementsByTagName('ows:LowerCorner').item(0)?.textContent?.split(' ').map(Number);

      const tmsTags = layer.getElementsByTagName('TileMatrixSet');
      const projections: Epsg[] = [];
      for (let j = 0; j < tmsTags.length; j++) {
        const epsg = Epsg.parse(tmsTags.item(j)?.textContent ?? '');
        if (epsg == null) continue;
        projections.push(epsg);
      }

      if (upperLeft == null || lowerRight == null) continue;
      this.layers.set(id, { id, name: title.replace('aerial ', ''), upperLeft, lowerRight, projections });
    }

    this.buildLayerSwitcher();
  }

  setLayerSwitcher(isLayerSwitcherOn: boolean): void {
    if (isLayerSwitcherOn) {
      document.getElementById('api-layer')?.classList.remove('display-none');
    } else {
      document.getElementById('api-layer')?.classList.add('display-none');
    }
  }
}
