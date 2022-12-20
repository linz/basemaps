import o from 'ospec';
import { nameImageryTitle } from '../util.js';

o.spec('util', () => {
  o('nameImageryTitle', () => {
    o(nameImageryTitle('Palmerston-north urban 2016-17 12.125m')).equals('palmerston-north_urban_2016-17_12-125m');
    o(nameImageryTitle('Palmerston-north urban 2016-17 12-125')).equals('palmerston-north_urban_2016-17_12-125');
    o(nameImageryTitle('Palmerston-north / urban 2016-17 12.125')).equals('palmerston-north_urban_2016-17_12-125');
    o(nameImageryTitle('Palmerston.north / urban 2016-17 12.125')).equals('palmerston-north_urban_2016-17_12-125');
    o(nameImageryTitle('Manawatū urban 2016-17 12.125m')).equals('manawatu_urban_2016-17_12-125m');
    o(nameImageryTitle('ĀāĒēĪīŌōŪū urban 2016-17 12.125m')).equals('aaeeiioouu_urban_2016-17_12-125m');
  });
});
