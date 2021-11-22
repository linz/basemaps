// import './global.js';

// import { addDebugLayer } from './debug.js';
// // import { Basemaps } from './map.js';
// import { SplitIo, SplitTreatment } from './split.js';
// import { BasemapsUi } from './ui.js';
// import { WindowUrl } from './url.js';
// import { isWebpSupported } from './webp.js';

import { h, Component, Fragment, render } from 'preact';

// export interface EmptyParams {
//   __noop: number;
// Noop
// }

class BasemapsLink extends Component<{ text: string; href: string }> {
  render(props: { text: string; href: string }) {
    return (
      <a rel="noopener" target="_blank" href={props.href}>
        {props.text}
        <i class="material-icons-round md-36">launch</i>
      </a>
    );
  }
}

class BasemapsHeader extends Component {
  render() {
    return (
      <header class="lui-header">
        <div class="lui-header-row">
          <div class="lui-header-col">
            <div class="lui-header-logo">
              <img class="linz-logo" src="/assets/logo-linz.svg" />
            </div>
            <div class="lui-header-title">
              <h1>Basemaps</h1>
            </div>
          </div>
          <div class="lui-header-col">
            <div class="lui-header-menu-item">
              <div class="lui-header-menu-icon" id="menu-open">
                <i class="material-icons-round md-36">menu</i>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }
}

class BasemapsFooter extends Component {
  render() {
    return (
      <footer class="lui-footer lui-footer-small lui-hide-sm lui-hide-xs" role="contentinfo">
        <div class="lui-footer-columns">
          <div class="align-center nz-govt-logo">
            <a rel="noopener" href="http://www.govt.nz/" target="_blank" aria-label="New Zealand Government">
              <img src="/assets/logo-nz-govt.svg" />
            </a>
          </div>
          <div class="justify-end">
            <ul class="lui-footer-list">
              <li class="lui-footer-inline-list-item">© 2021 Land Information New Zealand</li>
              <li class="lui-footer-inline-list-item">
                <BasemapsLink href="https://www.linz.govt.nz/contact-us" text="contact" />
              </li>
              <li class="lui-footer-inline-list-item">
                <BasemapsLink href="https://www.linz.govt.nz/privacy" text="Privacy" />
              </li>
              <li class="lui-footer-inline-list-item">
                <BasemapsLink
                  href="https://www.linz.govt.nz/data/linz-data/linz-basemaps/data-attribution"
                  text="Data Attribution"
                />
              </li>
            </ul>
          </div>
        </div>
      </footer>
    );
  }
}

// const canUseWebp = isWebpSupported();

class Basemaps extends Component<any, { count: number }> {
  constructor() {
    super();
    this.state = { count: 0 };
  }

  count = (): void => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return (
      <div>
        <BasemapsHeader />
        Hello World <button onClick={this.count}>{this.state.count} </button>
        <BasemapsFooter />
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const mainEl = document.getElementById('main');
  if (mainEl == null) throw new Error('Missing #main');
  render(<Basemaps />, mainEl);
  //   // const mapEl = document.getElementById('map');
  //   // if (mapEl == null) throw new Error('Cannot find #map element');
  //   // if (await canUseWebp) WindowUrl.ImageFormat = 'webp';
  //   // const basemaps = new Basemaps(mapEl);
  //   // window.basemaps = basemaps;
  //   // const ui = new BasemapsUi(basemaps);
  //   // window.basemapsUi = ui;
  //   // if (basemaps.config.debug) addDebugLayer(basemaps);
  //   // SplitIo.getClient().then((client) => {
  //   //   if (client == null) return;
  //   //   const isLayerSwitcherOn = SplitIo.getTreatment(SplitTreatment.LayerSwitcherButton) === 'on';
  //   //   ui.setLayerSwitcher(isLayerSwitcherOn);
  //   // });
});
