import { LuiBanner } from '@linzjs/lui';
import { Component, ReactNode } from 'react';

import { Config } from '../config.js';

export class Banner extends Component {
  _events: (() => boolean)[] = [];
  override componentDidMount(): void {
    this._events.push(Config.map.on('change', () => this.forceUpdate()));
  }
  override componentWillUnmount(): void {
    for (const e of this._events) e();
    this._events = [];
  }

  override render(): ReactNode {
    if (Config.map.isDebug) return;
    return <LuiBanner level="info">This is a info message</LuiBanner>;
  }
}
