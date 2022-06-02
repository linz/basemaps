import o from 'ospec';
import { isAllowedFile } from '../imagery.js';

o.spec('ImageryRoute', () => {
  o('should allow geojson and json files only', () => {
    o(isAllowedFile('foo.geojson')).equals(true);
    o(isAllowedFile('foo.json')).equals(true);
    o(isAllowedFile('foo.tiff')).equals(false);
    o(isAllowedFile('foo')).equals(false);
    o(isAllowedFile('')).equals(false);
    o(isAllowedFile(null as any)).equals(false);
  });
});
