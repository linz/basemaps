import { Component, ReactNode } from 'react';
import { Config } from '../config.js';
import { MapConfig } from '../config.map.js';

export const minDate = '1950-01-01T00:00:00.000Z';
export const maxDate = `${new Date().getFullYear().toString()}-12-31T23:59:59.999Z`;

export interface DateRangeState {
  dateAfter?: string;
  dateBefore?: string;
}
export class DateRange extends Component {
  state: DateRangeState = { dateAfter: minDate, dateBefore: maxDate };

  private _scheduled: number | NodeJS.Timeout | undefined;
  private _raf = 0;

  get yearAfter(): string | undefined {
    return this.state.dateAfter?.slice(0, 4);
  }

  get yearBefore(): string | undefined {
    return this.state.dateBefore?.slice(0, 4);
  }

  private scheduleUpdateConfig(): void {
    if (this._scheduled != null || this._raf !== 0) return;
    this._scheduled = setTimeout(() => {
      this._scheduled = undefined;
      this._raf = requestAnimationFrame(this.updateConfig);
    }, 200);
  }

  updateConfig = (): void => {
    this._raf = 0;
    Config.map.dateRange.dateAfter = this.state.dateAfter;
    Config.map.dateRange.dateBefore = this.state.dateBefore;
    Config.map.emit('dateRange', this.state);
  };

  handleChange = (event: React.ChangeEvent<HTMLInputElement>, id: 'before' | 'after'): void => {
    switch (id) {
      case 'after':
        this.setState({ dateAfter: `${event.target.value}-01-01T00:00:00.000Z` });
        break;
      case 'before':
        this.setState({ dateBefore: `${event.target.value}-12-31T23:59:59.999Z` });
        break;
    }
    this.scheduleUpdateConfig();
  };

  componentDidMount(): void {
    // Force to reset the url to valid range.
    this.setState({
      dateAfter: Config.map.dateRange.dateAfter ?? minDate,
      dateBefore: Config.map.dateRange.dateBefore ?? maxDate,
    });
    const dateRangeSearch = '?' + MapConfig.toUrl(Config.map);
    window.history.pushState(null, '', dateRangeSearch);
  }

  render(): ReactNode {
    return (
      <div className="date-range">
        <p>After: {this.yearAfter}</p>
        <input
          type="range"
          min={minDate.slice(0, 4)}
          max={this.yearBefore}
          step="1"
          value={this.yearAfter}
          onChange={(e): void => this.handleChange(e, 'after')}
        ></input>
        <p>Before: {this.yearBefore}</p>
        <input
          type="range"
          min={this.yearAfter}
          max={maxDate.slice(0, 4)}
          step="1"
          value={this.yearBefore}
          onChange={(e): void => this.handleChange(e, 'before')}
        ></input>
      </div>
    );
  }
}
