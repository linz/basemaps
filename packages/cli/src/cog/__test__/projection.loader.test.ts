import o from 'ospec';
import { ProjectionLoader } from '../projection.loader.js';
import sinon from 'sinon';
import { Nztm2000 } from '@basemaps/shared/build/proj/nztm2000.js';
import { Epsg } from '@basemaps/geo';
import { Projection } from '@basemaps/shared';
// import

o.spec('ProjectionLoader', () => {
  const sandbox = sinon.createSandbox();
  o.afterEach(() => sandbox.restore());
  o('should not load if already loaded', async () => {
    const fetchStub = sandbox.stub(ProjectionLoader, '_fetch');
    const res = await ProjectionLoader.load(2193);
    o(fetchStub.callCount).equals(0);
    o(res.code).equals(2193);
  });

  o('should fetch data from the internet', async () => {
    const fetchStub = sandbox
      .stub(ProjectionLoader, '_fetch')
      .resolves({ ok: true, text: () => Promise.resolve(Nztm2000) } as any);
    const res = await ProjectionLoader.load(3790);

    o(fetchStub.callCount).equals(1);

    o(res.code).equals(3790);
    o(Epsg.get(3790)).equals(res);
    o(Projection.get(3790).epsg).equals(res);
  });
});
