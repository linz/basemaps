import { IControl, Map } from 'maplibre-gl';

export class TerrainControl implements IControl {
  private demSource: string;
  private dsmSource: string;
  private exaggeration?: number;
  private container!: HTMLElement;
  private terrainButton!: HTMLButtonElement;
  private map?: Map;

  constructor(demSource: string, dsmSource: string, exaggeration?: number) {
    this.demSource = demSource;
    this.dsmSource = dsmSource;
    this.exaggeration = exaggeration;
  }

  onAdd(map: Map): HTMLElement {
    this.map = map;

    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

    this.terrainButton = document.createElement('button');
    this.terrainButton.title = 'Enable DEM terrain';
    const ctrlIcon = document.createElement('span');
    ctrlIcon.classList.add('maplibregl-ctrl-icon');
    ctrlIcon.setAttribute('aria-hidden', 'true');
    this.terrainButton.appendChild(ctrlIcon);
    this.terrainButton.className = 'maplibregl-ctrl-terrain';
    this.terrainButton.type = 'button';
    this.terrainButton.addEventListener('click', () => {
      this.terrainButton.classList.remove('maplibregl-ctrl-terrain');
      this.terrainButton.classList.remove('maplibregl-ctrl-terrain-enabled');
      this.terrainButton.classList.remove('ctrl-terrain-dsm-enabled');

      if (this.map?.getTerrain() === null) {
        this.map?.setTerrain({ source: this.demSource, exaggeration: this.exaggeration });
        this.terrainButton.classList.add('maplibregl-ctrl-terrain-enabled');
        this.terrainButton.title = 'Enable DSM terrain';
      } else if (this.map?.getTerrain()?.source === this.demSource) {
        this.map?.setTerrain({ source: this.dsmSource, exaggeration: this.exaggeration });
        this.terrainButton.classList.add('ctrl-terrain-dsm-enabled');
        this.terrainButton.title = 'Disable terrain';
      } else {
        this.map?.setTerrain(null);
        this.terrainButton.classList.add('maplibregl-ctrl-terrain');
        this.terrainButton.title = 'Enable DEM terrain';
      }
    });

    this.container.appendChild(this.terrainButton);
    return this.container;
  }

  onRemove(): void {
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.map = undefined;
  }
}
