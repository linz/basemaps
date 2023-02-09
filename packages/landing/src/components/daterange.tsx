import { Component, ReactNode } from 'react';
import { Config } from '../config';

const minYear = '1950';
const maxYear = '2023';

export interface DateRangeState {
  yearAfter?: string;
  yearBefore?: string;
}

export class DateRange extends Component {
  state: DateRangeState = { yearAfter: minYear, yearBefore: maxYear };

  private _scheduled: number | NodeJS.Timeout | undefined;
  private _raf = 0;

  private scheduleUpdateConfig(): void {
    if (this._scheduled != null || this._raf !== 0) return;
    this._scheduled = setTimeout(() => {
      this._scheduled = undefined;
      this._raf = requestAnimationFrame(this.updateConfig);
    }, 200);
  }

  updateConfig = (): void => {
    this._raf = 0;
    Config.map.dateRange.yearAfter = this.state.yearAfter;
    Config.map.dateRange.yearBefore = this.state.yearBefore;
    Config.map.emit('dateRange', this.state);
  };

  handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.id === 'after') {
      this.setState({ yearAfter: event.target.value });
    } else if (event.target.id === 'before') {
      this.setState({ yearBefore: event.target.value });
    }
    this.scheduleUpdateConfig();
  };

  render(): ReactNode {
    return (
      <div className="date-range">
        <p>After: {this.state.yearAfter}</p>
        <input
          id="after"
          type="range"
          min={minYear}
          max={this.state.yearBefore}
          step="1"
          value={this.state.yearAfter}
          onChange={this.handleChange}
        ></input>
        <p>Before: {this.state.yearBefore}</p>
        <input
          id="before"
          type="range"
          min={this.state.yearAfter}
          max={maxYear}
          step="1"
          value={this.state.yearBefore}
          onChange={this.handleChange}
        ></input>
      </div>
    );
  }
}
