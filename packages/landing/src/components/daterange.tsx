import { Attribution } from '@basemaps/attribution';
import { AttributionBounds } from '@basemaps/attribution/build/attribution.js';
import { clsx } from 'clsx';
import { Component, ReactNode } from 'react';

import { MapAttributionState, MapAttrState } from '../attribution.js';
import { Config } from '../config.js';

export const MinDate = '1950-01-01T00:00:00.000Z';
export const MaxDate = `${new Date().getFullYear().toString()}-12-31T23:59:59.999Z`;

export interface DateRangeState {
  attribution?: Attribution | null;
  filtered?: AttributionBounds[] | null;
}

export class DateRange extends Component<{ map: maplibregl.Map }, DateRangeState> {
  handleAttributionBounds = (): void => {
    this.setState({ filtered: this.getFilteredAttrs() });
  };

  getFilteredAttrs(): AttributionBounds[] | null {
    if (this.state == null || this.state.attribution == null) return null;
    const zoom = Math.round(this.props.map.getZoom() ?? 0);
    const extent = MapAttributionState.mapboxBoundToBbox(this.props.map.getBounds(), zoom, Config.map.tileMatrix);
    return this.state.attribution.filter({ extent, zoom });
  }

  override componentDidMount(): void {
    this.props.map.on('moveend', this.handleAttributionBounds);
    Config.map.on('filter', this.handleAttributionBounds);
    MapAttrState.getCurrentAttribution().then((attribution) => this.setState({ attribution }));
  }

  override render(): ReactNode {
    if (this.state == null) return;
    const filtered = this.state.filtered;
    if (filtered == null) return;

    // Filter it by map bounds
    const attrsByYear = MapAttrState.getAttributionByYear(filtered);
    const allAttrs = [...attrsByYear.entries()];
    allAttrs.sort((a, b) => a[0] - b[0]);

    const dateBefore = Config.map.filter.date.before;
    return (
      <div className="date-range">
        {allAttrs.map((el) => {
          const [year, attrs] = el;
          const isSelected = dateBefore?.startsWith(String(year));
          return (
            <button
              title={attrs.map((f) => f.collection.title).join('\n')}
              key={year}
              onClick={(): void => Config.map.setFilterDateRange({ before: String(year) })}
              className={clsx({ 'date-range__year': true, 'date-range__year--selected': isSelected })}
            >
              {year} - {attrs.length}
            </button>
          );
        })}
      </div>
    );
  }
}
