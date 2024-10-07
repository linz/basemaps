import { Component, ReactNode } from 'react';

import { Config } from '../config.js';
import { WindowUrl } from '../url.js';
import { FeatureUpdates } from './feature.updates.js';

const baseUrl = WindowUrl.baseUrl();

/**
 * Please updated the following settings and descriptions for new features pop up
 */
const bigImage = new URL('assets/Lg+3D+Maps+splash.gif', baseUrl).href; // Large gif file location
const smallImage = new URL('assets/Sml+3D+map+splash.gif', baseUrl).href; // Small gif file location
const closingDate = new Date('2024-10-30'); // End date for pop up screen
const dismissedKey = `DISMISSED_MODALS_LINZ_Basemaps_3D_Map`; // Optional to set as Config.Version to disable Modal as default
const recentUpdates = {
  children: (
    <>
      <h5 className="RecentUpdatesHeading">Basemaps are now viewable in 3D!</h5>
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
  enabled = new Date() <= closingDate;

  override render(): ReactNode {
    return (
      <FeatureUpdates
        id={dismissedKey}
        header="What's new"
        releaseVersion={Config.Version}
        bigImage={recentUpdates.bigImage}
        smallImage={recentUpdates.smallImage}
        enabled={this.enabled}
      >
        {recentUpdates.children}
      </FeatureUpdates>
    );
  }
}
