import { FeatureUpdates } from '../feature.updates.js';

// Make sure you turn off the toggle before making any changes... someone who has not dismissed it might log in...
const bigImage = 'https://dev.basemaps.linz.govt.nz/assets/Lg+3D+Maps+splash.gif';
const smallImage = 'https://dev.basemaps.linz.govt.nz/assets/Lg+3D+Maps+splash.gif';
const link = 'https://www.linz.govt.nz/products-services/data/linz-basemaps';

const recentUpdates = {
  children: (
    <>
      <h5 className="RecentUpdatesHeading">LINZ Basemaps 3D map is available now!</h5>
      <p>You can now view 3d Basemaps now.</p>
      <p>
        For more information see&nbsp;
        <a href={link} target="_blank" rel="noreferrer">
          What&apos;s new in Basemaps
        </a>
      </p>
    </>
  ),
  bigImage,
  smallImage,
};

export const dismissedKey = `Basemaps_Recent_Updates_Dismissed`;
export const releaseVersion = 'V7';
/*
  *****************   PLEASE READ BEFORE CHANGING!!!  *****************
  Make sure you delete lines 55 to 58 and uncomment line 54 before merging your changes.
  Those lines were only added for OCTN release.
 */
export const NewFeature = (): JSX.Element => {
  const resentUpdatesModalEnabled = true;
  return (
    <>
      <FeatureUpdates
        id={dismissedKey}
        header="What's new"
        bigImage={recentUpdates.bigImage}
        smallImage={recentUpdates.smallImage}
        enabled={resentUpdatesModalEnabled}
        releaseVersion={releaseVersion}
      >
        {recentUpdates.children}
      </FeatureUpdates>
    </>
  );
};
