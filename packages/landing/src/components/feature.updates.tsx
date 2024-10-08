import { clsx } from 'clsx';
import { Component, ReactNode } from 'react';
import ReactModal from 'react-modal';

import { Config } from '../config.js';

type FeatureUpdatesProps = {
  header: string;
  wrapperClass?: string;
  id: string;
  releaseVersion: string;
  closingDate: Date;
  enabled: boolean;
  children?: ReactNode;
} & { bigImage: string; smallImage: string; iframe?: never };

type FeatureUpdatesState = {
  showModal: boolean;
};

/**
 * FeatureUpdates is a re-implementation of @linzjs/lui -> LuiUpdatesSplashModal module,
 * This use to enable a one off pop up screen for introduce new feature of the recent release.
 *
 */
export class FeatureUpdates extends Component<FeatureUpdatesProps, FeatureUpdatesState> {
  constructor(props: FeatureUpdatesProps) {
    super(props);

    this.state = {
      showModal: this.showModal(),
    };
  }

  showModal(): boolean {
    if (!this.props.enabled) return false;
    // Disable after closing date
    if (this.props.closingDate < new Date()) return false;
    // Disable if dismissed
    const id = window.localStorage.getItem(this.props.id);
    const releaseVersion = this.props.releaseVersion.trim();
    if (releaseVersion === id) return false;
    // Disable if not same release version
    const currentVersion = Config.Version.trim();
    if (Config.Version === '' || currentVersion.length <= releaseVersion.length) return false;
    const versionMatch = currentVersion.slice(0, releaseVersion.length);
    if (versionMatch !== releaseVersion) return false;
    return true;
  }

  handleClose = (): void => {
    this.setState({ showModal: false });
    window.localStorage.setItem(this.props.id, this.props.releaseVersion);
  };

  override render(): ReactNode {
    const { header, wrapperClass, children, bigImage, smallImage } = this.props;
    const { showModal } = this.state;

    if (!showModal) return null;
    if (Config.map.isDebug) return;

    return (
      <ReactModal
        isOpen={showModal}
        shouldCloseOnEsc={true}
        onRequestClose={this.handleClose}
        shouldCloseOnOverlayClick={true}
        contentLabel="Recent updates"
        className="lui-splash-content lui-box-shadow"
        overlayClassName="splash_overlay"
      >
        <div className={clsx('lui-large-feature-notification', wrapperClass)}>
          <div className="lui-feature-header">
            <div className="lui-feature-title-wrapper">
              {this.WhatsNewIcon()}
              <h1>{header}</h1>
            </div>
            <button aria-label="Close dialog" onClick={this.handleClose}>
              {this.ClearIcon()}
            </button>
          </div>
          {this.FeatureImages(bigImage, smallImage)}
          <div className="lui-feature-text">{children}</div>
        </div>
      </ReactModal>
    );
  }

  FeatureImages(bigImage: string, smallImage: string): ReactNode {
    return (
      <div className="lui-feature-img">
        <img className="lui-hide-xs lui-hide-sm" alt={"What's new"} src={bigImage} />
        <img className="lui-hide-md lui-hide-lg lui-hide-xl" alt={"What's new"} src={smallImage} />
      </div>
    );
  }

  // @linzjs/lui whats_new_icon re-implementation
  WhatsNewIcon(): ReactNode {
    return (
      <span
        className={'LuiIcon LuiIcon--md lui-feature-title-icon '}
        data-icon={'ic_whats_new_updates'}
        aria-label={'whats_new_icon'}
      >
        <img src="assets/whats_new_updates.svg" alt="whats_new_icon" className="LuiIcon__image" />
      </span>
    );
  }

  // @linzjs/lui cross_icon re-implementation
  ClearIcon(): ReactNode {
    return (
      <span className="LuiIcon LuiIcon--md LuiIcon--interactive" data-icon="ic_clear" aria-label="cross_icon">
        <img src="/assets/clear.svg" alt="cross_icon" />
      </span>
    );
  }
}
