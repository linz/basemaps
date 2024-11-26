import { Component, ReactNode } from 'react';

import { WindowUrl } from '../../url.js';
import { FeatureUpdates } from '../feature.updates.js';

const baseUrl = WindowUrl.baseUrl();

/**
 * Please updated the following settings and descriptions for new features pop up
 */
const bigImage = new URL('assets/Lg+3D+Maps+splash.gif', baseUrl).href; // Large gif file location
const smallImage = new URL('assets/Sml+3D+map+splash.gif', baseUrl).href; // Small gif file location
const closingDate = new Date('2025-01-31'); // End date for pop up screen
const id = `LINZ_Basemaps_3D_Map`; // Optional to set as Config.Version to disable Modal as default
const dismissedKey = 'DISMISSED_MODALS_2024_10_3d_map'; // Feature released version can both been major version or minor version
const recentUpdates = {
  children: (
    <>
      <h2>Basemaps are now viewable in 3D!</h2>
      <p>
        To activate this function, click the mountains icon on the left-hand side then hold right-click to change your
        viewpoint.
      </p>
      <p>The new Labels button can also be toggled to show places names.</p>
    </>
  ),
  bigImage,
  smallImage,
};

export class NewFeature extends Component {
  enabled = true;

  override render(): ReactNode {
    return (
      <FeatureUpdates
        id={id}
        header="What's new"
        dismissedKey={dismissedKey}
        closingDate={closingDate}
        bigImage={recentUpdates.bigImage}
        smallImage={recentUpdates.smallImage}
        enabled={this.enabled}
      >
        {recentUpdates.children}
      </FeatureUpdates>
    );
  }
}
