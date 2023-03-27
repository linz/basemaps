import { Attribution, AttributionBounds } from '@basemaps/attribution';
import { Component, ReactNode } from 'react';
import { MapAttributionState, MapAttrState } from '../attribution.js';
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
    const after = this.state.after ?? MinDate;
    return after.slice(0, 4);
  }

  get yearBefore(): string {
    const before = this.state.before ?? MaxDate;
    return before.slice(0, 4);
  }

  clampDates(): DateRangeState | undefined {
    const attrs = this.getFilteredAttrs(true);
    if (attrs === null || this.state.after === undefined || this.state.before === undefined)
      return { after: this.state.after, before: this.state.before };

    let clampedAfter;
    let clampedBefore;

    attrs.sort((a, b) => {
      if (a.startDate < b.startDate) return -1;
      if (a.startDate > b.startDate) return 1;
      return 0;
    });
    const earliestStartDate = attrs[0].startDate;
    const latestEndDate = attrs[attrs.length - 1].endDate;

    if (this.state.after === MinDate) {
      clampedAfter = undefined;
    } else if (this.state.after < earliestStartDate) {
      clampedAfter = undefined;
    } else if (this.state.after >= latestEndDate) {
      clampedAfter = latestEndDate;
    } else {
      for (const a of attrs) {
        clampedAfter = a.startDate;
        if (this.state.after <= a.endDate) break;
      }
    }

    if (this.state.before === MaxDate) {
      clampedBefore = undefined;
    } else if (this.state.before > latestEndDate) {
      clampedBefore = undefined;
    } else if (this.state.before <= earliestStartDate) {
      clampedBefore = earliestStartDate;
    } else {
      attrs.reverse();
      for (const a of attrs) {
        clampedBefore = a.endDate;
        if (this.state.before <= a.endDate) break;
      }
    }

    return { after: clampedAfter, before: clampedBefore };
  }

  getFilteredAttrs(useZoom = false): AttributionBounds[] | null {
    if (this.state.attribution == null) return null;
    const zoom = Math.round(this.props.map.getZoom() ?? 0);
    const bbox = MapAttributionState.mapboxBoundToBbox(this.props.map.getBounds(), zoom, Config.map.tileMatrix);
    return this.state.attribution.filter({
      extent: bbox,
      zoom: useZoom ? zoom : undefined,
      dateAfter: this.state.after,
      dateBefore: this.state.before,
    });
  }

  componentDidMount(): void {
    this.setState({ after: MinDate, before: MaxDate });
    MapAttrState.getCurrentAttribution().then((attribution) => {
      this.setState({ attribution });
    });
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
    const clampedDateRange = this.clampDates();
    console.log({ raw: this.state, clamped: clampedDateRange });
    if (clampedDateRange) Config.map.setFilterDateRange(clampedDateRange);
  };

  render(): ReactNode {
    const map = this.props.map;
    if (map == null) return;
    const filtered = this.getFilteredAttrs();
    if (filtered == null) return;
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
        <p>After: {this.yearAfter}</p>
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
        ></input>
      </div>
    );
  }
}
