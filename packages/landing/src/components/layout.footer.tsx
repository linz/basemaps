import { Component, ReactNode } from 'react';

import { Config } from '../config.js';
import { Link } from './link.js';

export class Footer extends Component {
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
      <footer className="lui-footer lui-footer-small lui-hide-sm lui-hide-xs" role="contentinfo">
        <div className="lui-footer-columns">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link href="http://www.govt.nz/" ariaLabel="New Zealand Government">
              <img src="/assets/logo-nz-govt.svg" width="211px" />
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ul className="lui-footer-list">
              <li className="lui-footer-inline-list-item">
                <Link href="https://www.linz.govt.nz/contact-us">Contact</Link>
              </li>
              <li className="lui-footer-inline-list-item">
                <Link href="https://www.linz.govt.nz/privacy">Privacy</Link>
              </li>
              <li className="lui-footer-inline-list-item">
                <Link href="https://www.linz.govt.nz/data/linz-data/linz-basemaps/data-attribution">
                  Data Attribution
                </Link>
              </li>
              <li className="lui-footer-inline-list-item">
                <Link href="https://www.linz.govt.nz/copyright">Copyright</Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    );
  }
}
