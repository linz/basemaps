import { Attribution } from '@basemaps/attribution';
import { AttributionBounds } from '@basemaps/attribution/build/attribution.js';
import { Component, ReactNode } from 'react';
import { MapAttribution, Mas } from '../attribution.js';
import { Config } from '../config.js';

export const MinDate = '1950-01-01T00:00:00.000Z';
export const MaxDate = `${new Date().getFullYear().toString()}-12-31T23:59:59.999Z`;

export interface DateRangeState {
  after?: string;
  before?: string;
  attribution?: Attribution | null;
}

export class DateRange extends Component<{ map: maplibregl.Map }, DateRangeState> {
  get yearAfter(): string {
    return Config.map.filter.date.after == null ? MinDate.slice(0, 4) : Config.map.filter.date.after.slice(0, 4);
  }

  get yearBefore(): string {
    return Config.map.filter.date.before == null ? MaxDate.slice(0, 4) : Config.map.filter.date.before.slice(0, 4);
  }

  componentDidMount(): void {
    this.setState({ after: MinDate, before: MaxDate });
    MapAttribution.getCurrentAttribution().then((attribution) => {
      this.setState({ attribution });
    });

    this.filtered = Mas.filterAttributionToMap(this.map);

    // this.props.map.on('moveend', this.updateBounds);
    /// TODO need events to update this if things change
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>, id: 'before' | 'after'): void => {
    switch (id) {
      case 'after':
        this.setState({ after: `${event.target.value}-01-01T00:00:00.000Z` });
        break;
      case 'before':
        this.setState({ before: `${event.target.value}-12-31T23:59:59.999Z` });
        break;
    }
  };

  // updateBounds = (): void => {
  //   const loc = Config.map.getLocation(this.props.map);
  //   console.log(loc);
  //   this.bounds = loc;
  // };

  render(): ReactNode {
    if (this.props.map == null) return;
    const attr = this.state.attribution;
    if (attr == null) return null;
    const map = this.props.map;
    // attr.filter(this.bounds);
    const zoom = Math.round(map.getZoom() ?? 0);
    const bounds = map.getBounds();
    const bbox = MapAttribution.mapboxBoundToBbox(bounds, zoom, Config.map.tileMatrix);
    const filtered = attr.filter(bbox);

    this.props.map.getBounds();
    // Filter it by map bounds
    let maxCount = 0;
    const dateRange = { min: MaxDate, max: MinDate };
    const attrsByYear = new Map<number, AttributionBounds[]>();
    for (const a of filtered) {
      if (!a.startDate || !a.endDate) continue;
      if (a.endDate > dateRange.max) dateRange.max = a.endDate;
      if (a.startDate < dateRange.min) dateRange.min = a.startDate;

      const startYear = Number(a.startDate.slice(0, 4));
      const endYear = Number(a.endDate.slice(0, 4));
      for (let year = startYear; year <= endYear; year++) {
        const attrs = attrsByYear.get(year) ?? [];
        attrs.push(a);
        if (attrs.length > maxCount) maxCount = attrs.length;
        attrsByYear.set(year, attrs);
      }
    }
    const allAttrs = [...attrsByYear.entries()];
    allAttrs.sort((a, b) => a[0] - b[0]);
    return (
      <div className="date-range">
        {allAttrs.map((f) => {
          const boxSize = Math.round(100 * (f[1].length / maxCount));
          return (
            <div style={{ width: '140px' }} key={f[0]}>
              <div style={{ width: `${boxSize}px`, background: '#ff00ff' }}>
                {f[0]} ({f[1].length}){' '}
              </div>
            </div>
          );
        })}
        {/* <p>After: {this.yearAfter}</p>
        <input
          type="range"
          min={MinDate.slice(0, 4)}
          max={this.yearBefore}
          step="1"
          value={this.yearAfter}
          onChange={(e): void => this.handleChange(e, 'after')}
        ></input>
        <p>Before: {this.yearBefore}</p>
        <input
          type="range"
          min={this.yearAfter}
          max={MaxDate.slice(0, 4)}
          step="1"
          value={this.yearBefore}
          onChange={(e): void => this.handleChange(e, 'before')}
        ></input> */}
      </div>
    );
  }
}
