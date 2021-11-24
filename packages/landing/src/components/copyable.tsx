import { Component, ComponentChild } from 'preact';
import clsx from 'clsx';
import { Config, GaEvent, gaEvent } from '../config.js';

export interface CopyableProps {
  header: string;
  value: string;
}

export class Copyable extends Component<CopyableProps, { copied: boolean }> {
  render(): ComponentChild {
    return (
      <div>
        <label>{this.props.header}</label>
        <div class={clsx({ 'lui-menu-label': true, 'menu-copyable': true, 'menu-copyable-copied': this.state.copied })}>
          <button class="menu-copyable-icon-button" title="Copy" onClick={this.copy}>
            <i class="material-icons-round">{this.state.copied ? 'check' : 'content_copy'}</i>
          </button>
          <input value={this.props.value} readonly={true} />
        </div>
      </div>
    );
  }

  _copyTimeout: null | NodeJS.Timeout = null;
  copy = (): void => {
    /**
     * Create a readablish name for the copy event
     * @example `copy:topographic::basic:tilejson`
     * @example `copy:aerial:wmts:nztm2000quad`
     */
    gaEvent(GaEvent.Ui, 'copy:' + Config.map.layerKey + ':' + this.props.header.replace(/ /g, '').toLowerCase());
    navigator.clipboard.writeText(this.props.value);
    this.setState({ copied: true });
    if (this._copyTimeout != null) clearTimeout(this._copyTimeout);
    this._copyTimeout = setTimeout(() => this.setState({ copied: false }), 1_000);
  };
}
