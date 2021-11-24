import { Component, ComponentChild, Fragment, render } from 'preact';
import { Footer } from './components/layout.footer.js';
import { Header } from './components/layout.header.js';
import { Basemaps } from './components/map.js';
import { WindowUrl } from './url.js';
import { isWebpSupported } from './webp.js';

class Page extends Component {
  render(): ComponentChild {
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

  const mainEl = document.getElementById('main');
  if (mainEl == null) throw new Error('Missing #main');
  render(<Page />, mainEl);
});
