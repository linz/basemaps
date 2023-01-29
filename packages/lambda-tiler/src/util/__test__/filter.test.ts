import { ConfigLayer } from '@basemaps/config';
import o from 'ospec';
import { mockUrlRequest } from '../../__tests__/xyz.util.js';
import { filterLayers } from '../filter.js';

o.spec('filterLayers', () => {
  const sourceLayers: ConfigLayer[] = [
    {
      name: 'waikato-0_625m-snc12836-2004',
      title: 'Waikato 0.625m SNC12836 (2004-2008)',
    },
    {
      name: 'hawkes-bay--manawat-whanganui-0_75m-snc30001-2002',
      title: 'Hawkes Bay / Manawatū-Whanganui 0.75m SNC30001 (2002)',
    },
    {
      name: 'canterbury-0_75m-snc25054-2000-2001',
      title: 'Canterbury 0.75m SNC25054 (2000-2001)',
    },
    {
      name: 'otago-0_375m-sn3806-1975',
      title: 'Otago 0.375m SN3806 (1975)',
    },
  ];

  o('should not filter with empty parameters', () => {
    const layers = filterLayers(mockUrlRequest('/foo/bar,js'), sourceLayers);
    o(layers).deepEquals(sourceLayers);
  });

  o('should filter date[after]', () => {
    const dateAfter = '2003-12-31T23:59:59.999';
    const layers = filterLayers(mockUrlRequest('/foo/bar,js', `?date[after]=${dateAfter}`), sourceLayers);
    o(layers).deepEquals([sourceLayers[0]]);
  });

  o('should filter date[before]', () => {
    const dateBefore = '2003-01-01T00:00:00.000Z';
    const layers = filterLayers(mockUrlRequest('/foo/bar,js', `?date[before]=${dateBefore}`), sourceLayers);
    o(layers).deepEquals(sourceLayers.slice(1));
  });

  o('should filter date[before] in between years', () => {
    const dateBefore = '2026-01-01T00:00:00.000Z';
    const layer = [{ name: '', title: 'Waikato 0.625m SNC12836 (2020-2028)' }];
    const layers = filterLayers(mockUrlRequest('/foo/bar,js', `?date[before]=${dateBefore}`), layer);
    o(layers).deepEquals(layer);
  });

  o('should filter date[after] in between years', () => {
    const dateAfter = '2026-12-31T23:59:59.999Z';
    const layer = [{ name: '', title: 'Waikato 0.625m SNC12836 (2020-2028)' }];
    const layers = filterLayers(mockUrlRequest('/foo/bar,js', `?date[after]=${dateAfter}`), layer);
    o(layers).deepEquals(layer);
  });

  o('should filter date[after] and date[before] in between years', () => {
    const dateAfter = '2026-12-31T23:59:59.999Z';
    const dateBefore = '2028-01-01T00:00:00.000Z';

    const layer = [{ name: '', title: 'Waikato 0.625m SNC12836 (2020-2028)' }];
    const layers = filterLayers(
      mockUrlRequest('/foo/bar,js', `?date[after]=${dateAfter}&date[before]=${dateBefore}`),
      layer,
    );
    o(layers).deepEquals(layer);
  });

  o('should filter date[after] and date[before] in between years with single year', () => {
    const dateAfter = '2026-12-31T23:59:59.999Z';
    const dateBefore = '2028-01-01T00:00:00.000Z';

    const layer = [{ name: '', title: 'Waikato 0.625m SNC12836 (2028)' }];
    const layers = filterLayers(
      mockUrlRequest('/foo/bar,js', `?date[after]=${dateAfter}&date[before]=${dateBefore}`),
      layer,
    );
    o(layers).deepEquals(layer);
  });
});
