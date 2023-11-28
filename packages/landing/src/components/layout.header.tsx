import { EpsgCode, GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';
import { clsx } from 'clsx';
import { Component, Fragment, ReactNode } from 'react';

import { Config, GaEvent, gaEvent } from '../config.js';
import { LayerInfo } from '../config.map.js';
import { MapOptionType } from '../url.js';
import { Copyable } from './copyable.js';
import { LayerSwitcherDropdown } from './layer.switcher.dropdown.js';
import { Icon, Link } from './link.js';

export interface HeaderState {
  isMenuOpen: boolean;
  layers?: Map<string, LayerInfo>;
}
export class Header extends Component<unknown, HeaderState> {
  _events: (() => boolean)[] = [];

  override componentDidMount(): void {
    this.setState({ isMenuOpen: false });
    this._events.push(Config.map.on('change', () => this.forceUpdate()));
    this._events.push(Config.map.on('filter', () => this.renderLinksTiles()));

    // If individual layers are on, we need the layer info to determine if they can use NZTM2000Quad WMTS
    Config.map.layers.then((layers) => this.setState({ layers }));
  }
  override componentWillUnmount(): void {
    for (const e of this._events) e();
    this._events = [];
  }

  menuToggle = (): void => {
    const isMenuOpen = !this.state.isMenuOpen;
    gaEvent(GaEvent.Ui, isMenuOpen ? 'menu:open' : 'menu:close');
    this.setState({ isMenuOpen });
  };

  override render(): ReactNode {
    if (Config.map.isDebug) return;
    return (
      <header className="lui-header">
        <div className="lui-header-row">
          <div className="lui-header-col">
            <div className="lui-header-logo">
              <img className="linz-logo" src="/assets/logo-linz.svg" />
            </div>
            <div className="lui-header-title">
              <h1>Basemaps</h1>
            </div>
          </div>
          <div className="lui-header-col">
            <div className="lui-header-menu-item">
              <div className="lui-header-menu-icon">
                <i className="material-icons-round md-36" onClick={this.menuToggle} style={{ cursor: 'pointer' }}>
                  {this.state.isMenuOpen ? 'close' : 'menu'}
                </i>
              </div>
            </div>
          </div>
        </div>
        <div
          className={clsx({
            'lui-menu-drawer': true,
            'lui-menu-drawer-closed': !this.state.isMenuOpen,
            'lui-menu-drawer-wide': true,
          })}
          aria-hidden={this.state.isMenuOpen}
        >
          <LayerSwitcherDropdown />
          {this.renderLinks()}

          <h6>Developer API Keys</h6>
          <p>Contact us for free API keys with better support for public web and mobile apps.</p>
          <button className="lui-button lui-button-primary contact-us" onClick={this.contactUs}>
            Contact us
          </button>

          {this.renderAbout()}
        </div>
      </header>
    );
  }

  contactUs = (): void => {
    const subject = 'Request Basemaps Developer Access';
    const body = `
Give us a few key details to sign up for Developer Access to LINZ Basemaps. We will respond with your Apps' unique API key.

Your Name:

Your Email:

Your Service/App URL:

`;
    gaEvent(GaEvent.Ui, 'contact-us:click');
    window.location.href = `mailto:basemaps@linz.govt.nz?subject=${encodeURI(subject)}&body=${encodeURI(body)}`;
  };

  renderAboutLi(text: string, href: string, icon?: ReactNode): ReactNode {
    return (
      <li>
        <Link href={href}>
          {text}
          {icon == null ? <Icon name="launch" /> : icon}
        </Link>
      </li>
    );
  }

  renderAbout(): ReactNode {
    return (
      <Fragment>
        <h6>About Basemaps</h6>
        <ul className="about-links">
          {this.renderAboutLi(
            'Get started',
            'https://www.linz.govt.nz/data/linz-data/linz-basemaps/get-started-linz-basemaps',
          )}
          {this.renderAboutLi(
            'Technical information',
            'https://www.linz.govt.nz/data/linz-data/linz-basemaps/linz-basemaps-documentation',
          )}
          {this.renderAboutLi(
            'How to use our APIs',
            'https://www.linz.govt.nz/data/linz-data/linz-basemaps/how-use-linz-basemaps-apis',
          )}
          {this.renderAboutLi('Github', 'https://github.com/linz/basemaps', this.renderGithubLogo())}
          <li>
            <Link href="https://github.com/linz/basemaps/blob/master/CHANGELOG.md">
              Version{' '}
              <span className="basemaps-version" title={`Build: ${Config.BuildId}`}>
                {Config.Version}
              </span>
            </Link>
          </li>
        </ul>
      </Fragment>
    );
  }

  renderGithubLogo(): ReactNode {
    return (
      <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"
        />
      </svg>
    );
  }

  renderLinks(): ReactNode {
    return (
      <Fragment>
        <h6>90 day API keys</h6>
        <p>API keys expire after 90 days, if a longer duration is needed please request a developer API key</p>
        <Copyable header="Api Key" value={Config.ApiKey} />
        {this.renderLinksTiles()}
      </Fragment>
    );
  }

  /** Projections to show WMTS links for */
  _validProjections = new Set<EpsgCode>([EpsgCode.Google, EpsgCode.Nztm2000]);
  validProjections(): Set<EpsgCode> {
    if (this.state.layers == null) return this._validProjections;
    return this.state.layers.get(Config.map.layerId)?.projections ?? this._validProjections;
  }

  renderLinksTiles(): ReactNode {
    if (Config.map.isVector) {
      return (
        <Fragment>
          <Copyable key="StyleJSON" header="StyleJSON" value={Config.map.toTileUrl(MapOptionType.Style)} />
          <Copyable key="XYZ" header="XYZ" value={Config.map.toTileUrl(MapOptionType.TileVectorXyz)} />
        </Fragment>
      );
    }

    const projections = this.validProjections();

    const children: ReactNode[] = [];
    if (projections.has(EpsgCode.Nztm2000)) {
      const nztmTileUrl = Config.map.toTileUrl(
        MapOptionType.Wmts,
        Nztm2000QuadTms,
        undefined,
        undefined,
        undefined,
        Config.map.filter.date,
      );
      children.push(<Copyable key="NZTM2000Quad" header="WMTS: NZTM2000Quad" value={nztmTileUrl} />);
    }

    if (projections.has(EpsgCode.Google)) {
      const googleTileUrl = Config.map.toTileUrl(
        MapOptionType.Wmts,
        GoogleTms,
        undefined,
        undefined,
        undefined,
        Config.map.filter.date,
      );
      const googleXyzTileUrl = Config.map.toTileUrl(MapOptionType.TileRaster, GoogleTms);
      children.push(<Copyable key="WebMercatorQuad" header="WMTS: WebMercatorQuad" value={googleTileUrl} />);
      children.push(<Copyable key="XYZ" header="XYZ" value={googleXyzTileUrl} />);
    }

    return <Fragment>{children}</Fragment>;
  }
}
