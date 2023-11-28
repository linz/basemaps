import { Component, Fragment, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

import { Footer } from './components/layout.footer.js';
import { Header } from './components/layout.header.js';
import { Basemaps } from './components/map.js';
import { Config } from './config.js';
import { WindowUrl } from './url.js';
import { isWebpSupported } from './webp.js';

class Page extends Component {
  render(): ReactNode {
    return (
      <Fragment>
        <Header />
        <Basemaps />
        <Footer />
      </Fragment>
    );
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const canUseWebp = await isWebpSupported();
  if (await canUseWebp) WindowUrl.ImageFormat = 'webp';

  Config.map.updateFromUrl();

  const mainEl = document.getElementById('main');
  if (mainEl == null) throw new Error('Missing #main');
  const root = createRoot(mainEl);
  root.render(<Page />);
});
