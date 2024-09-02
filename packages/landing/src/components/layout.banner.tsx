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
    return (
      <div className="LuiBannerV2 has-level ic_info_outline">
        <div className="info">
          {/* <span
            ref={ref}
            className="LuiBannerV2-Icon"
            data-icon={name}
            title={title}
            aria-label={alt}
            {...spanProps}
            style={customStyle}
          >
            {iconSVG}
          </span> */}
          <div>Basemaps Release Info ....</div>
        </div>
      </div>
    );
  }
}
