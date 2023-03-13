import { Component, ReactNode } from 'react';
import { Config } from '../config';

const minDate = '1950-01-01T00:00:00.000Z';
const maxDate = `${new Date().getFullYear().toString()}-12-31T23:59:59.999Z`;

export interface DateRangeState {
  after?: string;
  before?: string;
}

export class DateRange extends Component {
  state: DateRangeState = { after: minDate, before: maxDate };

  get yearAfter(): string | undefined {
    return this.state.after?.slice(0, 4);
  }

  get yearBefore(): string | undefined {
    return this.state.before?.slice(0, 4);
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
    Config.map.filter.date.after = this.state.after;
    Config.map.filter.date.before = this.state.before;
    Config.map.emit('filter', { date: this.state });
  };

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
