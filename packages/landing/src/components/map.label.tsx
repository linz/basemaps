import { IControl } from 'maplibre-gl';

import { Config, GaEvent, gaEvent } from '../config.js';

export const LabelsDisabledLayers = new Set(['topographic', 'topolite']);

export class MapLabelControl implements IControl {
  map?: maplibregl.Map;
  container?: HTMLDivElement;
  button?: HTMLButtonElement;
  buttonIcon?: HTMLElement;
  events: (() => boolean)[] = [];

  onAdd(map: maplibregl.Map): HTMLDivElement {
    this.map = map;
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

    this.button = document.createElement('button');
    this.button.className = 'maplibregl-ctrl-labels';
    this.button.type = 'button';
    this.button.addEventListener('click', this.toggleLabels);

    this.buttonIcon = document.createElement('i');
    this.buttonIcon.className = 'material-icons-round';
    this.buttonIcon.innerText = 'more';
    this.button.appendChild(this.buttonIcon);
    this.container.appendChild(this.button);

    this.events.push(Config.map.on('labels', this.updateLabelIcon));
    this.events.push(Config.map.on('layer', this.updateLabelIcon));

    this.updateLabelIcon();
    return this.container;
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container);
    for (const evt of this.events) evt();
    this.events = [];
    this.map = undefined;
  }

  toggleLabels = (): void => {
    const labelState = !Config.map.labels;
    gaEvent(GaEvent.Ui, `labels:${labelState}`);
    Config.map.setLabels(labelState);
  };

  updateLabelIcon = (): void => {
    if (this.button == null) return;
    this.button.classList.remove('maplibregl-ctrl-labels-enabled');

    // Topographic style disables the button
    if (Config.map.style && LabelsDisabledLayers.has(Config.map.style)) {
      this.button.classList.add('display-none');
      this.button.title = 'Topographic style does not support layers';
      return;
    }
    this.button.classList.remove('display-none');

    if (Config.map.labels) {
      this.button.classList.add('maplibregl-ctrl-labels-enabled');
      this.button.title = 'Hide Labels';
    } else {
      this.button.title = 'Show Labels';
    }
  };
}
