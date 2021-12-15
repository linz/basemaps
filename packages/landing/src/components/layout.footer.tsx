import { Component, ComponentChild } from 'preact';
import { Config } from '../config.js';
import { Link } from './link.js';

export class Footer extends Component {
  _events: (() => boolean)[] = [];
  componentWillMount(): void {
    this._events.push(Config.map.on('change', () => this.setState(this.state)));
  }
  componentWillUnmount(): void {
    for (const e of this._events) e();
    this._events = [];
  }

  render(): ComponentChild {
    if (Config.map.isDebug) return;
    return (
      <footer class="lui-footer lui-footer-small lui-hide-sm lui-hide-xs" role="contentinfo">
        <div class="lui-footer-columns">
          <div style="display:flex; align-items:center">
            <Link href="http://www.govt.nz/" ariaLabel="New Zealand Government">
              <img src="/assets/logo-nz-govt.svg" />
            </Link>
          </div>
          <div class="justify-end">
            <ul class="lui-footer-list">
              <li class="lui-footer-inline-list-item">© 2021 Land Information New Zealand</li>
              <li class="lui-footer-inline-list-item">
                <Link href="https://www.linz.govt.nz/contact-us">Contact</Link>
              </li>
              <li class="lui-footer-inline-list-item">
                <Link href="https://www.linz.govt.nz/privacy">Privacy</Link>
              </li>
              <li class="lui-footer-inline-list-item">
                <Link href="https://www.linz.govt.nz/data/linz-data/linz-basemaps/data-attribution">
                  Data Attribution
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    );
  }
}
