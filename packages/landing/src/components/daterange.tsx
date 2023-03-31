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
  filtered?: AttributionBounds[] | null;
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

  updateAttributionBounds(): void {
    this.setState({ filtered: this.getFilteredAttrs() });
  }

  getFilteredAttrs(useZoom = false): AttributionBounds[] | null {
    if (this.state.attribution == null) return null;
    const zoom = Math.round(this.props.map.getZoom() ?? 0);
    const bbox = MapAttributionState.mapboxBoundToBbox(this.props.map.getBounds(), zoom, Config.map.tileMatrix);
    return this.state.attribution.filter({
      extent: bbox,
      zoom: useZoom ? zoom : undefined,
    });
  }

  componentDidMount(): void {
    this.setState({ after: MinDate, before: MaxDate });
    // this.props.map.on('moveend', this.updateBounds);
    MapAttrState.getCurrentAttribution().then((attribution) => {
      this.setState({ attribution });
    });
  }

  // handleChange = (event: React.ChangeEvent<HTMLInputElement>, id: 'before' | 'after'): void => {
  //   switch (id) {
  //     case 'after':
  //       this.setState({ after: `${event.target.value}-01-01T00:00:00.000Z` });
  //       break;
  //     case 'before':
  //       this.setState({ before: `${event.target.value}-12-31T23:59:59.999Z` });
  //       break;
  //   }
  //   Config.map.setFilterDateRange({ after: this.state.after, before: this.state.before });
  // };

  handleClick = (year: number): void => {
    console.log(year);
    this.setState({ before: year.toString() });
    Config.map.setFilterDateRange({ after: this.state.after, before: this.state.before });
    this.updateAttributionBounds();
  };

  render(): ReactNode {
    const map = this.props.map;
    if (map == null) return;
    const filtered = this.getFilteredAttrs();
    if (filtered == null) return;
    this.props.map.getBounds();
    // Filter it by map bounds
    const attrsByYear = MapAttrState.getAttributionByYear(filtered);
    const allAttrs = [...attrsByYear.entries()];
    allAttrs.sort((a, b) => a[0] - b[0]);
    // return (
    //   <div className="date-range">
    //     {allAttrs.map((f) => {
    //       const boxSize = Math.round(100 * (f[1].length / attrsByYear.size));
    //       return (
    //         <div style={{ width: '140px' }} key={f[0]}>
    //           <div style={{ width: `${boxSize}px`, background: '#ff00ff' }}>
    //             {f[0]} ({f[1].length}){' '}
    //           </div>
    //         </div>
    //       );
    //     })}
    //     <p>After: {this.yearAfter}</p>
    //     <input
    //       type="range"
    //       min={MinDate.slice(0, 4)}
    //       max={this.yearBefore}
    //       step="1"
    //       value={this.yearAfter}
    //       onChange={(e): void => this.handleChange(e, 'after')}
    //     ></input>
    //     <p>Before: {this.yearBefore}</p>
    //     <input
    //       type="range"
    //       min={this.yearAfter}
    //       max={MaxDate.slice(0, 4)}
    //       step="1"
    //       value={this.yearBefore}
    //       onChange={(e): void => this.handleChange(e, 'before')}
    //     ></input>
    //   </div>
    // );
    return (
      <div className="date-range">
        {allAttrs.map((year) => (
          <button
            key={year[0]}
            onClick={(): void => this.handleClick(year[0])}
            style={{
              margin: '5px',
              padding: '10px',
              border:
                this.state.before != null && this.state.before === year[0].toString()
                  ? '2px solid blue'
                  : '1px solid gray',
              borderRadius: '5px',
              backgroundColor:
                this.state.before != null && this.state.before === year[0].toString() ? 'lightblue' : 'white',
            }}
          >
            {year[0]}
          </button>
        ))}
      </div>
    );
  }
}
