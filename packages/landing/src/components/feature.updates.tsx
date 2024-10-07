import { clsx } from 'clsx';
import { Component, ReactNode } from 'react';
import ReactModal from 'react-modal';

interface IFrameConfig {
  url: string;
  width: number;
  height: number;
  title: string;
  iframeWrapperClass?: string;
  iFrameProps?: Partial<JSX.IntrinsicElements['iframe']>;
}

type FeatureUpdatesProps = {
  header: string;
  wrapperClass?: string;
  id: string;
  releaseVersion: string;
  enabled: boolean;
  children?: ReactNode;
} & (
  | { bigImage: string; smallImage: string; iframe?: never }
  | { bigImage?: never; smallImage?: never; iframe: IFrameConfig }
);

type FeatureUpdatesState = {
  showModal: boolean;
};

export class FeatureUpdates extends Component<FeatureUpdatesProps, FeatureUpdatesState> {
  constructor(props: FeatureUpdatesProps) {
    super(props);
    const currentVersion = window.localStorage.getItem(this.props.id);
    this.state = {
      showModal: this.props.enabled && this.props.releaseVersion.trim() !== currentVersion,
    };
  }

  handleClose = (): void => {
    this.setState({ showModal: false });
    window.localStorage.setItem(this.props.id, this.props.releaseVersion);
  };

  renderFeatureMedia(): ReactNode {
    const { bigImage, smallImage, iframe } = this.props;
    if (iframe) {
      return this.FeatureIFrame(iframe);
    }
    if (bigImage && smallImage) {
      return this.FeatureImages(bigImage, smallImage);
    }
    return null; // Return null if no media is available
  }

  override render(): ReactNode {
    const { header, wrapperClass, children } = this.props;
    const { showModal } = this.state;

    if (!showModal) return null;

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
          {this.renderFeatureMedia()}
          <div className="lui-feature-text">{children}</div>
        </div>
      </ReactModal>
    );
  }

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
  ClearIcon(): ReactNode {
    return (
      <span className="LuiIcon LuiIcon--md LuiIcon--interactive" data-icon="ic_clear" aria-label="cross_icon">
        <img src="/assets/clear.svg" alt="cross_icon" />
      </span>
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

  FeatureIFrame(iframeConfig: IFrameConfig): ReactNode {
    const wrapperClass = iframeConfig.iframeWrapperClass || 'iframe-wrapper';
    const iFrameProps = iframeConfig.iFrameProps || {};
    return (
      <div className={wrapperClass}>
        <iframe
          width={iframeConfig.width}
          height={iframeConfig.height}
          src={iframeConfig.url}
          title={iframeConfig.title}
          {...iFrameProps}
        ></iframe>
      </div>
    );
  }
}
